"""
Background data synchronization service
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.enhanced_zoho_service import EnhancedZohoService
from app.services.currency_service import CurrencyService
from app.models.analysis import Analysis, Deal

class DataSyncService:
    def __init__(self):
        self.zoho_service = EnhancedZohoService()
        self.currency_service = CurrencyService()
        self.last_sync_time = None
        self.sync_in_progress = False
    
    async def start_scheduled_sync(self):
        """Start the background sync scheduler"""
        print("🔄 Starting Pipeline Pulse data sync scheduler...")
        
        # Initial full sync
        await self.full_sync()
        
        # Schedule regular delta syncs every 15 minutes
        while True:
            try:
                await asyncio.sleep(15 * 60)  # 15 minutes
                await self.delta_sync()
            except Exception as e:
                print(f"❌ Sync error: {e}")
                await asyncio.sleep(60)  # Wait 1 minute on error
    
    async def full_sync(self) -> Dict[str, Any]:
        """Perform full synchronization with Zoho CRM"""
        if self.sync_in_progress:
            return {"status": "already_running"}
        
        self.sync_in_progress = True
        sync_start = datetime.now()
        
        try:
            print("🔄 Starting full sync with Zoho CRM...")
            
            # Fetch all deals from Zoho
            zoho_deals = await self.zoho_service.get_all_deals()
            
            if not zoho_deals:
                return {"status": "no_data", "message": "No deals found in Zoho CRM"}
            
            # Transform and process deals
            processed_deals = []
            for zoho_deal in zoho_deals:
                try:
                    # Transform to Pipeline Pulse format
                    deal = self.zoho_service.transform_zoho_deal_to_pipeline_deal(zoho_deal)
                    
                    # Convert currency to SGD
                    if deal["currency"] != "SGD" and deal["amount"] > 0:
                        sgd_amount = await self.currency_service.convert_to_sgd(
                            deal["amount"], 
                            deal["currency"]
                        )
                        deal["sgd_amount"] = sgd_amount
                    else:
                        deal["sgd_amount"] = deal["amount"]
                    
                    processed_deals.append(deal)
                    
                except Exception as e:
                    print(f"⚠️ Error processing deal {zoho_deal.get('id', 'unknown')}: {e}")
            
            # Store in database (create new analysis)
            db = next(get_db())
            try:
                analysis = Analysis(
                    filename="live_crm_sync",
                    upload_time=sync_start,
                    total_deals=len(processed_deals),
                    deals=processed_deals
                )
                
                db.add(analysis)
                db.commit()
                
                # Update O2R opportunities
                await self._sync_o2r_opportunities(processed_deals)
                
                self.last_sync_time = sync_start
                
                print(f"✅ Full sync completed: {len(processed_deals)} deals processed")
                
                return {
                    "status": "success",
                    "deals_synced": len(processed_deals),
                    "sync_time": sync_start.isoformat()
                }
                
            finally:
                db.close()
        
        except Exception as e:
            print(f"❌ Full sync failed: {e}")
            return {"status": "error", "message": str(e)}
        
        finally:
            self.sync_in_progress = False
    
    async def delta_sync(self) -> Dict[str, Any]:
        """Perform delta synchronization (only changed records)"""
        if not self.last_sync_time:
            return await self.full_sync()
        
        try:
            print("🔄 Starting delta sync...")
            
            # Get deals modified since last sync
            modified_deals = await self.zoho_service.get_deals_modified_since(
                self.last_sync_time
            )
            
            if not modified_deals:
                print("✅ No changes detected")
                return {"status": "no_changes"}
            
            # Process modified deals
            processed_deals = []
            for zoho_deal in modified_deals:
                deal = self.zoho_service.transform_zoho_deal_to_pipeline_deal(zoho_deal)
                
                # Convert currency
                if deal["currency"] != "SGD" and deal["amount"] > 0:
                    sgd_amount = await self.currency_service.convert_to_sgd(
                        deal["amount"], 
                        deal["currency"]
                    )
                    deal["sgd_amount"] = sgd_amount
                else:
                    deal["sgd_amount"] = deal["amount"]
                
                processed_deals.append(deal)
            
            # Update database (merge with existing analysis)
            await self._update_analysis_with_delta(processed_deals)
            
            # Update O2R opportunities
            await self._sync_o2r_opportunities(processed_deals)
            
            self.last_sync_time = datetime.now()
            
            print(f"✅ Delta sync completed: {len(processed_deals)} deals updated")
            
            return {
                "status": "success",
                "deals_updated": len(processed_deals),
                "sync_time": self.last_sync_time.isoformat()
            }
        
        except Exception as e:
            print(f"❌ Delta sync failed: {e}")
            return {"status": "error", "message": str(e)}
    
    async def _sync_o2r_opportunities(self, deals: List[Dict[str, Any]]):
        """Sync deals to O2R opportunities"""
        try:
            from app.api.o2r.data_bridge import O2RDataBridge
            
            o2r_bridge = O2RDataBridge()
            
            # Convert deals to O2R opportunities
            for deal in deals:
                await o2r_bridge.sync_deal_to_o2r(deal)
            
        except Exception as e:
            print(f"⚠️ Error syncing O2R opportunities: {e}")
    
    async def _update_analysis_with_delta(self, modified_deals: List[Dict[str, Any]]):
        """Update existing analysis with modified deals"""
        db = next(get_db())
        try:
            # Get latest analysis
            latest_analysis = db.query(Analysis).order_by(Analysis.upload_time.desc()).first()
            
            if latest_analysis:
                # Update existing deals or add new ones
                existing_deals = latest_analysis.deals or []
                
                for modified_deal in modified_deals:
                    # Find and update existing deal or add new one
                    found = False
                    for i, existing_deal in enumerate(existing_deals):
                        if existing_deal.get("record_id") == modified_deal.get("record_id"):
                            existing_deals[i] = modified_deal
                            found = True
                            break
                    
                    if not found:
                        existing_deals.append(modified_deal)
                
                latest_analysis.deals = existing_deals
                latest_analysis.total_deals = len(existing_deals)
                db.commit()
        
        finally:
            db.close()