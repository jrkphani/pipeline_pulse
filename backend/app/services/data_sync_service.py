"""
Background data synchronization service - SDK Migration
Uses official Zoho SDK for bulk operations with optimized performance
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
import logging
from app.core.database import get_db
from app.services.async_zoho_wrapper import AsyncZohoWrapper
from app.services.sdk_response_transformer import get_response_transformer
from app.services.currency_service import CurrencyService
from app.services.field_mapping_service import field_mapper
from app.models.crm_record import CrmRecord
from app.services.zoho_sdk_manager import get_sdk_manager

logger = logging.getLogger(__name__)

class DataSyncService:
    """SDK-based data synchronization service with bulk operation optimization"""
    
    def __init__(self):
        self.sdk_manager = get_sdk_manager()
        self.transformer = get_response_transformer()
        self.currency_service = CurrencyService()
        self.last_sync_time = None
        self.sync_in_progress = False
        self.batch_size = 200  # SDK max per request
        self.concurrent_batches = 3  # Parallel batch processing
    
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
        """Perform full synchronization with Zoho CRM using SDK bulk operations"""
        if self.sync_in_progress:
            return {"status": "already_running"}
        
        self.sync_in_progress = True
        sync_start = datetime.now()
        
        try:
            logger.info("🔄 Starting SDK-based full sync with Zoho CRM...")
            
            # Ensure SDK is initialized
            if not self.sdk_manager.is_initialized():
                logger.error("SDK not initialized")
                return {"status": "error", "message": "SDK not initialized"}
            
            # Fetch all deals using SDK with optimized batching
            all_deals = await self._fetch_all_deals_sdk()
            
            if not all_deals:
                return {"status": "no_data", "message": "No deals found in Zoho CRM"}
            
            logger.info(f"📊 Retrieved {len(all_deals)} deals from Zoho CRM")
            
            # Process deals in parallel batches for performance
            processed_deals = await self._process_deals_in_batches(all_deals)
            
            # Validate O2R data completeness
            await self._validate_o2r_completeness(processed_deals)
            
            logger.info(f"✅ Processed {len(processed_deals)} deals")
            
            # Store in database using bulk operations
            db = next(get_db())
            try:
                # Use bulk operations for database efficiency
                await self._bulk_store_deals(db, processed_deals)
                
                # Update O2R opportunities with SDK integration
                await self._sync_o2r_opportunities(processed_deals)
                
                self.last_sync_time = sync_start
                
                logger.info(f"✅ SDK full sync completed: {len(processed_deals)} deals processed")
                
                return {
                    "status": "success",
                    "deals_synced": len(processed_deals),
                    "sync_time": sync_start.isoformat(),
                    "sync_method": "sdk_bulk"
                }
                
            finally:
                db.close()
        
        except Exception as e:
            logger.error(f"❌ SDK full sync failed: {e}")
            return {"status": "error", "message": str(e)}
        
        finally:
            self.sync_in_progress = False
    
    async def delta_sync(self) -> Dict[str, Any]:
        """Perform delta synchronization using SDK modified_since parameter"""
        if not self.last_sync_time:
            return await self.full_sync()
        
        try:
            logger.info("🔄 Starting SDK delta sync...")
            
            # Use SDK to get modified deals efficiently
            modified_deals = await self._fetch_modified_deals_sdk(self.last_sync_time)
            
            if not modified_deals:
                logger.info("✅ No changes detected")
                return {"status": "no_changes"}
            
            logger.info(f"📊 Found {len(modified_deals)} modified deals")
            
            # Process modified deals using batch processing
            processed_deals = await self._process_deals_in_batches(modified_deals)
            
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
    
    async def _fetch_all_deals_sdk(self) -> List[Dict[str, Any]]:
        """Fetch all deals from Zoho CRM using SDK with optimized pagination"""
        try:
            logger.info("🔄 Fetching all deals using SDK bulk operations...")
            
            all_deals = []
            page = 1
            has_more = True
            
            async with AsyncZohoWrapper() as wrapper:
                while has_more:
                    try:
                        logger.info(f"📄 Fetching page {page} (batch size: {self.batch_size})")
                        
                        # Comprehensive field list with DISCOVERED O2R field mappings
                        fields_to_request = [
                            # Core business fields
                            "id", "Deal_Name", "Account_Name", "Amount", "Stage", "Closing_Date",
                            "Created_Time", "Modified_Time", "Owner", "Description", "Pipeline", 
                            "Probability", "Currency", "Lead_Source", "Type", "Contact_Name",
                            "Next_Step", "Expected_Revenue", "Campaign_Source", "Record_Image",
                            
                            # ✅ CONFIRMED O2R FIELD MAPPINGS (Found via Fields Metadata API)
                            "Region",                        # → Territory
                            "Solution_Type",                 # → Service Line
                            "Invoice_Date",                  # → Invoice Date
                            "Kick_off_Date",                 # → Kickoff Date
                            "Proposal_Submission_date",      # → Proposal Date  
                            "SOW_Work_Start_Date",           # → SOW Date
                            "PO_Generation_Date",            # → PO Date
                            "OB_Recognition_Date",           # → Revenue Date
                            
                            # 🔍 O2R CANDIDATES (Medium confidence - need validation)
                            "Funding_Programs",              # → AWS Funded (Type of Funding)
                            "Partner_portal_Opportunity_ID", # → Alliance Motion
                            "Distribution_Partner",          # → Alliance Motion (alternative)
                            "Account_Manager",               # → Strategic Account (user ref)
                            "Strategic_advantage",           # → Strategic Account (flag)
                            "Payment_Terms_in_days1",        # → Payment Date (closest match)
                            
                            # 📋 Additional useful business fields discovered
                            "Project_Type", "SOW_Number", "P_O_Number", "P_O_Amount",
                            "Customer_Approved", "Revenue_Type", "Revenue_Stage", 
                            "Market_Segment", "Country", "Billing_Date"
                        ]
                        
                        # Ensure we don't exceed Zoho's 50-field limit
                        if len(fields_to_request) > 50:
                            fields_to_request = fields_to_request[:50]
                            logger.warning(f"⚠️ Field list truncated to 50 fields due to Zoho API limit")
                        
                        result = await wrapper.get_records(
                            module_name="Deals",
                            page=page,
                            per_page=self.batch_size,
                            fields=fields_to_request
                        )
                        
                        if result.get("status") == "success":
                            page_deals = result.get("data", [])
                            
                            if page_deals:
                                all_deals.extend(page_deals)
                                logger.info(f"✅ Retrieved {len(page_deals)} deals from page {page}")
                                page += 1
                                
                                # Check if we got fewer records than requested (last page)
                                if len(page_deals) < self.batch_size:
                                    has_more = False
                            else:
                                has_more = False
                        else:
                            logger.error(f"❌ SDK error on page {page}: {result.get('message')}")
                            has_more = False
                    
                    except Exception as e:
                        logger.error(f"❌ Error fetching page {page}: {e}")
                        has_more = False
            
            logger.info(f"✅ SDK fetch completed: {len(all_deals)} total deals retrieved")
            return all_deals
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch deals via SDK: {e}")
            return []
    
    async def _fetch_modified_deals_sdk(self, since_time: datetime) -> List[Dict[str, Any]]:
        """Fetch modified deals since specific time using SDK"""
        try:
            logger.info(f"🔄 Fetching deals modified since {since_time} using SDK...")
            
            # For now, fetch all deals and filter by modified time
            # TODO: Use SDK's modified_since parameter when available
            all_deals = await self._fetch_all_deals_sdk()
            
            modified_deals = []
            for deal in all_deals:
                try:
                    # Check if deal was modified after since_time
                    modified_time_str = deal.get("Modified_Time")
                    if modified_time_str:
                        # Parse Zoho's datetime format
                        modified_time = datetime.fromisoformat(
                            modified_time_str.replace('Z', '+00:00')
                        ).replace(tzinfo=None)
                        
                        if modified_time > since_time:
                            modified_deals.append(deal)
                
                except Exception as e:
                    logger.warning(f"⚠️ Error checking modification time for deal {deal.get('id')}: {e}")
                    # Include deal if we can't determine modification time
                    modified_deals.append(deal)
            
            logger.info(f"✅ Found {len(modified_deals)} modified deals out of {len(all_deals)} total")
            return modified_deals
            
        except Exception as e:
            logger.error(f"❌ Failed to fetch modified deals via SDK: {e}")
            return []
    
    async def _bulk_store_deals(self, db: Session, deals: List[Dict[str, Any]]):
        """Store deals in database using bulk operations for efficiency"""
        try:
            logger.info(f"💾 Bulk storing {len(deals)} deals to database...")
            
            # Prepare bulk data
            records_to_create = []
            records_to_update = []
            
            for deal in deals:
                record_id = deal.get("id")
                if not record_id:
                    continue
                
                # Check if record exists
                existing_record = db.query(CrmRecord).filter(
                    CrmRecord.record_id == record_id
                ).first()
                
                if existing_record:
                    existing_record.current_data = deal
                    existing_record.updated_at = datetime.now()
                    existing_record.last_seen_date = datetime.now().date()
                    existing_record.is_active = True
                    records_to_update.append(existing_record)
                else:
                    new_record = CrmRecord(
                        record_id=record_id,
                        current_data=deal,
                        is_active=True,
                        first_seen_date=datetime.now().date(),
                        last_seen_date=datetime.now().date()
                    )
                    records_to_create.append(new_record)
            
            # Bulk insert new records
            if records_to_create:
                db.bulk_save_objects(records_to_create)
                logger.info(f"✅ Created {len(records_to_create)} new records")
            
            # Update existing records (already modified in memory)
            if records_to_update:
                logger.info(f"✅ Updated {len(records_to_update)} existing records")
            
            db.commit()
            logger.info(f"💾 Bulk storage completed: {len(records_to_create)} created, {len(records_to_update)} updated")
            
        except Exception as e:
            logger.error(f"❌ Bulk storage failed: {e}")
            db.rollback()
            raise
    
    async def _sync_o2r_opportunities(self, deals: List[Dict[str, Any]]):
        """Sync deals to O2R opportunities"""
        try:
            from app.api.o2r.data_bridge import O2RDataBridge
            
            o2r_bridge = O2RDataBridge()
            
            # Convert deals to O2R opportunities
            for deal in deals:
                await o2r_bridge.sync_deal_to_o2r(deal)
            
        except Exception as e:
            logger.error(f"⚠️ Error syncing O2R opportunities: {e}")
    
    async def _process_deals_in_batches(self, deals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process deals in batches with SDK optimizations"""
        try:
            logger.info(f"🔄 Processing {len(deals)} deals with SDK optimizations")
            
            # Use bulk currency processing for better performance
            db = next(get_db())
            try:
                # Process currency conversion in bulk using optimized service
                processed_deals = self.currency_service.process_sdk_deals_currency(deals, db)
            finally:
                db.close()
            
            # Add processing metadata to all deals
            for deal in processed_deals:
                deal["processed_at"] = datetime.now().isoformat()
                deal["sync_method"] = "sdk_bulk"
                deal["transformer"] = "sdk_response_transformer"
            
            logger.info(f"✅ Successfully processed {len(processed_deals)} deals with bulk optimizations")
            return processed_deals
            
        except Exception as e:
            logger.error(f"Batch processing failed: {e}")
            # Fallback to individual processing
            return await self._process_deals_individually(deals)
    
    async def _process_deals_individually(self, deals: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Fallback individual processing for deals"""
        processed_deals = []
        
        for deal in deals:
            try:
                processed_deal = deal.copy()
                
                # Individual currency conversion
                currency = deal.get("currency", "SGD")
                amount = float(deal.get("amount", 0))
                
                if currency != "SGD" and amount > 0:
                    db = next(get_db())
                    try:
                        sgd_amount, rate_source = self.currency_service.convert_to_sgd(
                            amount, currency, db
                        )
                        processed_deal["sgd_amount"] = sgd_amount
                        processed_deal["currency_rate_source"] = rate_source
                    finally:
                        db.close()
                else:
                    processed_deal["sgd_amount"] = amount
                    processed_deal["currency_rate_source"] = "base"
                
                # Add metadata
                processed_deal["processed_at"] = datetime.now().isoformat()
                processed_deal["sync_method"] = "sdk_individual"
                
                processed_deals.append(processed_deal)
                
            except Exception as e:
                logger.warning(f"⚠️ Error processing deal {deal.get('id', 'unknown')}: {e}")
                deal["processing_error"] = str(e)
                processed_deals.append(deal)
        
        return processed_deals
    
    async def _update_analysis_with_delta(self, modified_deals: List[Dict[str, Any]]):
        """Update existing CRM records with modified deals"""
        db = next(get_db())
        try:
            for modified_deal in modified_deals:
                record_id = modified_deal.get("record_id")
                if not record_id:
                    continue
                
                # Update existing record or create new one
                existing_record = db.query(CrmRecord).filter(
                    CrmRecord.record_id == record_id
                ).first()
                
                if existing_record:
                    existing_record.current_data = modified_deal
                    existing_record.updated_at = datetime.now()
                    existing_record.last_seen_date = datetime.now().date()
                    existing_record.is_active = True
                else:
                    new_record = CrmRecord(
                        record_id=record_id,
                        current_data=modified_deal,
                        is_active=True,
                        first_seen_date=datetime.now().date(),
                        last_seen_date=datetime.now().date()
                    )
                    db.add(new_record)
            
            db.commit()
        
        finally:
            db.close()
    
    async def get_sync_status(self) -> Dict[str, Any]:
        """Get current sync status and SDK metrics"""
        sdk_status = self.sdk_manager.validate_initialization()
        
        return {
            "sync_in_progress": self.sync_in_progress,
            "last_sync_time": self.last_sync_time.isoformat() if self.last_sync_time else None,
            "sdk_status": sdk_status,
            "batch_size": self.batch_size,
            "concurrent_batches": self.concurrent_batches,
            "sync_method": "sdk_optimized"
        }
    
    async def _validate_o2r_completeness(self, deals: List[Dict[str, Any]]):
        """Validate O2R data completeness and log recommendations"""
        try:
            logger.info("🔍 Validating O2R data completeness...")
            
            total_deals = len(deals)
            complete_deals = 0
            all_missing_fields = set()
            
            for deal in deals:
                validation = field_mapper.validate_data_completeness(deal)
                
                if validation["is_complete"]:
                    complete_deals += 1
                
                all_missing_fields.update(validation["missing_fields"])
            
            completion_rate = (complete_deals / total_deals) * 100 if total_deals > 0 else 0
            
            logger.info(f"📊 O2R Completeness Analysis:")
            logger.info(f"   Total Deals: {total_deals}")
            logger.info(f"   Complete Deals: {complete_deals}")
            logger.info(f"   Completion Rate: {completion_rate:.1f}%")
            
            if all_missing_fields:
                logger.warning(f"⚠️  Missing O2R Fields: {', '.join(sorted(all_missing_fields))}")
                logger.info("💡 Recommendation: Create these custom fields in Zoho CRM for full O2R tracking")
            else:
                logger.info("✅ All O2R fields present!")
            
        except Exception as e:
            logger.error(f"⚠️ Error validating O2R completeness: {e}")
    
    async def manual_sync(self, sync_type: str = "delta") -> Dict[str, Any]:
        """Manually trigger sync with SDK"""
        if sync_type == "full":
            return await self.full_sync()
        else:
            return await self.delta_sync()