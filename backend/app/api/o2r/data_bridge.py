"""
O2R Data Bridge Service - Converts pipeline data to O2R format
"""

import json
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime
from uuid import uuid4
from sqlalchemy.orm import Session

from app.models.o2r.opportunity import O2ROpportunity, OpportunityPhase, HealthSignalType
from app.models.o2r.health import HealthSignalEngine
from app.api.o2r.import_processor import O2RDataEnricher
from app.services.currency_service import currency_service
from app.services.enhanced_zoho_service import EnhancedZohoService


class O2RDataBridge:
    """
    Service to bridge pipeline analysis data with O2R tracking system
    """
    
    def __init__(self, db_path: str = "pipeline_pulse.db"):
        self.db_path = db_path
        self.health_engine = HealthSignalEngine()
        self.data_enricher = O2RDataEnricher()
        self.zoho_service = EnhancedZohoService()
    
    def get_latest_pipeline_data(self) -> Optional[Dict[str, Any]]:
        """
        Get the latest pipeline analysis data from SQLite database
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get the latest analysis
            cursor.execute("""
                SELECT data, total_deals, filename 
                FROM analyses 
                WHERE is_latest = 1 
                ORDER BY created_at DESC 
                LIMIT 1
            """)
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                data_json, total_deals, filename = result
                return {
                    "data": json.loads(data_json),
                    "total_deals": total_deals,
                    "filename": filename
                }
            
            return None
            
        except Exception as e:
            print(f"Error fetching pipeline data: {e}")
            return None
    
    def convert_pipeline_to_o2r(self, pipeline_data: Dict[str, Any], db: Session) -> List[O2ROpportunity]:
        """
        Convert pipeline analysis data to O2R opportunities
        """
        opportunities = []

        if not pipeline_data or "data" not in pipeline_data:
            return opportunities

        # The data is stored as a JSON array directly
        deals = pipeline_data["data"]

        # Handle case where data might be wrapped in an object
        if isinstance(deals, dict) and "deals" in deals:
            deals = deals["deals"]

        # Ensure deals is a list
        if not isinstance(deals, list):
            print(f"Expected deals to be a list, got {type(deals)}")
            return opportunities

        for deal in deals:
            try:
                # Create O2R opportunity from pipeline deal
                o2r_opp = self._create_o2r_opportunity_from_deal(deal, db)
                if o2r_opp:
                    opportunities.append(o2r_opp)
            except Exception as e:
                print(f"Error converting deal {deal.get('Opportunity Name', 'Unknown')}: {e}")
                continue

        return opportunities
    
    def _create_o2r_opportunity_from_deal(self, deal: Dict[str, Any], db: Session) -> Optional[O2ROpportunity]:
        """
        Create an O2R opportunity from a pipeline deal
        """
        try:
            # Extract basic information using actual field names
            deal_name = deal.get("Opportunity Name", "Unknown Deal")
            account_name = deal.get("account_name", "Unknown Account")

            # Handle amount and currency conversion
            original_amount = 0.0
            original_currency = "SGD"
            sgd_amount = 0.0

            try:
                # Get original amount and currency (check multiple possible field names)
                if "Opportunity Amount" in deal:
                    original_amount = float(deal["Opportunity Amount"])
                elif "amount" in deal:
                    original_amount = float(deal["amount"])
                elif "SGD Amount" in deal:
                    original_amount = float(deal["SGD Amount"])
                elif "OCH Revenue" in deal:
                    original_amount = float(deal["OCH Revenue"])

                # Get original currency (check multiple possible field names)
                original_currency = (
                    deal.get("Currency") or
                    deal.get("currency") or
                    deal.get("CURRENCY") or
                    "SGD"
                )
                if not original_currency:
                    original_currency = "SGD"

                # Convert to SGD using currency service
                if original_amount > 0:
                    sgd_amount, rate_source = currency_service.convert_to_sgd(
                        original_amount, original_currency, db
                    )
                    print(f"Converted {original_amount} {original_currency} to {sgd_amount} SGD (source: {rate_source})")
                else:
                    sgd_amount = 0.0

            except (ValueError, TypeError) as e:
                print(f"Error converting amount for deal {deal_name}: {e}")
                sgd_amount = 0.0
                original_amount = 0.0

            # Extract other fields with defaults
            stage = deal.get("stage", "Unknown")
            probability = deal.get("probability", 0)

            # Map territory from available fields
            territory = (
                deal.get("Territory") or
                deal.get("Region") or
                deal.get("Country") or
                deal.get("territory") or
                "Unknown Territory"
            )

            # Map service type from available fields
            service_type = (
                deal.get("Service Type") or
                deal.get("Product") or
                deal.get("Solution") or
                deal.get("deal_type") or
                "Unknown Service"
            )

            # Map owner using actual field name
            owner = (
                deal.get("Opportunity Owner") or
                deal.get("Owner") or
                deal.get("Account Manager") or
                deal.get("Sales Rep") or
                "Unknown Owner"
            )
            
            # Determine current phase based on stage
            current_phase = self._map_stage_to_phase(stage)
            
            # Extract closing date (convert to date, not datetime)
            closing_date = datetime.now().date()
            if "closing_date" in deal:
                try:
                    # Handle timestamp (milliseconds)
                    if isinstance(deal["closing_date"], (int, float)):
                        closing_date = datetime.fromtimestamp(deal["closing_date"] / 1000).date()
                    else:
                        closing_date = datetime.strptime(str(deal["closing_date"]), "%Y-%m-%d").date()
                except:
                    closing_date = datetime.now().date()

            # Create O2R opportunity
            o2r_opportunity = O2ROpportunity(
                id=str(uuid4()),
                deal_name=deal_name,
                account_name=account_name,
                sgd_amount=sgd_amount,
                original_amount=original_amount if original_amount > 0 else sgd_amount,  # Store original amount
                original_currency=original_currency if original_amount > 0 else "SGD",  # Store original currency
                territory=territory,
                service_type=service_type,
                owner=owner,
                current_phase=current_phase,
                stage=stage,
                probability=probability,

                # Required fields
                current_stage=stage,  # Use stage as current_stage
                closing_date=closing_date,
                created_date=datetime.now(),
                country=territory,  # Use territory as country
                updated_by="Pipeline Data Bridge",

                # Default O2R specific fields
                funding_type="Unknown",
                strategic_account=sgd_amount > 1000000,  # Strategic if > 1M SGD

                # Milestone dates (will be enriched later)
                opportunity_created_date=datetime.now(),
                proposal_submission_date=None,
                po_generation_date=None,
                revenue_realization_date=None,

                # Health and tracking
                health_signal=HealthSignalType.YELLOW,  # Will be calculated
                health_reason="Imported from pipeline analysis",
                requires_attention=False,
                updated_this_week=False,
                last_updated=datetime.now(),

                # Action items (will be generated)
                action_items=[]
            )
            
            # Enrich with calculated fields
            o2r_opportunity = self._enrich_o2r_opportunity(o2r_opportunity)
            
            return o2r_opportunity
            
        except Exception as e:
            print(f"Error creating O2R opportunity for deal '{deal_name}': {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def _map_stage_to_phase(self, stage: str) -> OpportunityPhase:
        """
        Map pipeline stage to O2R phase
        """
        stage_lower = stage.lower()

        if any(keyword in stage_lower for keyword in ["prospect", "qualify", "discovery", "initial"]):
            return OpportunityPhase.PHASE_1
        elif any(keyword in stage_lower for keyword in ["proposal", "quote", "negotiation"]):
            return OpportunityPhase.PHASE_2
        elif any(keyword in stage_lower for keyword in ["commit", "contract", "execution", "delivery"]):
            return OpportunityPhase.PHASE_3
        elif any(keyword in stage_lower for keyword in ["closed", "won", "revenue", "complete"]):
            return OpportunityPhase.PHASE_4
        else:
            return OpportunityPhase.PHASE_1  # Default to Phase 1
    
    def _enrich_o2r_opportunity(self, opportunity: O2ROpportunity) -> O2ROpportunity:
        """
        Enrich O2R opportunity with calculated fields
        """
        try:
            # Calculate health signal
            health_signal = self.health_engine.calculate_health_signal(opportunity)
            opportunity.health_signal = health_signal.signal
            opportunity.health_reason = health_signal.reason
            opportunity.requires_attention = health_signal.signal in [HealthSignalType.RED, HealthSignalType.BLOCKED]
            
            # Generate action items
            opportunity.action_items = self.data_enricher._generate_action_items(opportunity)
            
            return opportunity
            
        except Exception as e:
            print(f"Error enriching O2R opportunity: {e}")
            return opportunity
    
    def sync_pipeline_to_o2r(self, db: Session) -> Dict[str, Any]:
        """
        Sync latest pipeline data to O2R tracker
        """
        try:
            # Get latest pipeline data
            pipeline_data = self.get_latest_pipeline_data()

            if not pipeline_data:
                return {
                    "status": "error",
                    "message": "No pipeline data found to sync",
                    "synced_count": 0
                }

            # Convert to O2R opportunities
            o2r_opportunities = self.convert_pipeline_to_o2r(pipeline_data, db)

            return {
                "status": "success",
                "message": f"Successfully synced {len(o2r_opportunities)} opportunities from pipeline data",
                "synced_count": len(o2r_opportunities),
                "source_file": pipeline_data.get("filename", "Unknown"),
                "opportunities": o2r_opportunities
            }

        except Exception as e:
            return {
                "status": "error",
                "message": f"Sync failed: {str(e)}",
                "synced_count": 0
            }
    
    async def sync_deal_to_o2r(self, deal: Dict[str, Any]) -> Optional[O2ROpportunity]:
        """
        Sync a single deal from CRM to O2R (for live sync)
        """
        try:
            # Create O2R opportunity from CRM deal
            o2r_opp = self._create_o2r_opportunity_from_crm_deal(deal)
            if o2r_opp:
                # Save to database would happen in the calling service
                return o2r_opp
            return None
            
        except Exception as e:
            print(f"Error syncing deal to O2R: {e}")
            return None
    
    def _create_o2r_opportunity_from_crm_deal(self, deal: Dict[str, Any]) -> Optional[O2ROpportunity]:
        """
        Create O2R opportunity from live CRM deal data
        """
        try:
            # Use the CRM deal format (different from pipeline analysis format)
            deal_name = deal.get("opportunity_name", "Unknown Deal")
            account_name = deal.get("account_name", "Unknown Account")
            
            # Handle amount - it's already in SGD from the enhanced service
            sgd_amount = deal.get("sgd_amount", 0.0)
            original_amount = deal.get("amount", sgd_amount)
            original_currency = deal.get("currency", "SGD")
            
            stage = deal.get("stage", "Unknown")
            probability = deal.get("probability", 0)
            territory = deal.get("territory", "Unknown Territory")
            service_line = deal.get("service_line", "Unknown Service")
            owner = deal.get("owner", "Unknown Owner")
            
            # Determine current phase based on stage
            current_phase = self._map_stage_to_phase(stage)
            
            # Parse closing date
            closing_date = datetime.now().date()
            if deal.get("closing_date"):
                try:
                    closing_date = datetime.strptime(deal["closing_date"], "%Y-%m-%d").date()
                except:
                    closing_date = datetime.now().date()
            
            # Create O2R opportunity
            o2r_opportunity = O2ROpportunity(
                id=deal.get("record_id", str(uuid4())),  # Use CRM record ID
                deal_name=deal_name,
                account_name=account_name,
                sgd_amount=sgd_amount,
                original_amount=original_amount,
                original_currency=original_currency,
                territory=territory,
                service_type=service_line,
                owner=owner,
                current_phase=current_phase,
                stage=stage,
                probability=probability,

                # Required fields
                current_stage=stage,
                closing_date=closing_date,
                created_date=datetime.now(),
                country=deal.get("country", territory),
                updated_by="Live CRM Sync",

                # O2R specific fields
                funding_type="Unknown",
                strategic_account=deal.get("strategic_account", sgd_amount > 1000000),

                # Milestone dates from CRM
                opportunity_created_date=datetime.now(),
                proposal_submission_date=self._parse_date(deal.get("proposal_date")),
                po_generation_date=self._parse_date(deal.get("po_date")),
                revenue_realization_date=self._parse_date(deal.get("revenue_date")),

                # Health and tracking
                health_signal=HealthSignalType.YELLOW,
                health_reason="Synced from live CRM",
                requires_attention=False,
                updated_this_week=True,  # Just synced
                last_updated=datetime.now(),

                # Action items (will be generated)
                action_items=[]
            )
            
            # Enrich with calculated fields
            o2r_opportunity = self._enrich_o2r_opportunity(o2r_opportunity)
            
            return o2r_opportunity
            
        except Exception as e:
            print(f"Error creating O2R opportunity from CRM deal: {e}")
            return None
    
    def _parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string to datetime object"""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, "%Y-%m-%d")
        except:
            return None
    
    async def sync_o2r_changes_to_crm(self, opportunity: O2ROpportunity) -> Dict[str, Any]:
        """
        Sync O2R opportunity changes back to Zoho CRM
        """
        try:
            # Prepare update data for Zoho CRM
            update_data = {
                "Stage": opportunity.stage,
                "Probability": opportunity.probability,
                "Amount": opportunity.original_amount,
                "Currency": opportunity.original_currency,
                "Closing_Date": opportunity.closing_date.strftime("%Y-%m-%d") if opportunity.closing_date else None,
            }
            
            # Add milestone dates if available
            if opportunity.proposal_submission_date:
                update_data["Proposal_Date"] = opportunity.proposal_submission_date.strftime("%Y-%m-%d")
            
            if opportunity.po_generation_date:
                update_data["PO_Date"] = opportunity.po_generation_date.strftime("%Y-%m-%d")
            
            if opportunity.revenue_realization_date:
                update_data["Revenue_Date"] = opportunity.revenue_realization_date.strftime("%Y-%m-%d")
            
            # Update in Zoho CRM
            success = await self.zoho_service.update_deal(opportunity.id, update_data)
            
            if success:
                return {
                    "status": "success",
                    "message": f"Successfully synced O2R changes for {opportunity.deal_name} to CRM",
                    "deal_id": opportunity.id
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to sync O2R changes for {opportunity.deal_name} to CRM",
                    "deal_id": opportunity.id
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error syncing O2R changes to CRM: {str(e)}",
                "deal_id": opportunity.id
            }
    
    async def sync_milestone_updates_to_crm(self, opportunity_id: str, milestone_updates: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sync specific milestone updates from O2R to CRM
        """
        try:
            # Map O2R milestone fields to CRM fields
            crm_update_data = {}
            
            if "proposal_submission_date" in milestone_updates:
                date_val = milestone_updates["proposal_submission_date"]
                if date_val:
                    crm_update_data["Proposal_Date"] = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else date_val
            
            if "sow_date" in milestone_updates:
                date_val = milestone_updates["sow_date"]
                if date_val:
                    crm_update_data["SOW_Date"] = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else date_val
            
            if "po_generation_date" in milestone_updates:
                date_val = milestone_updates["po_generation_date"]
                if date_val:
                    crm_update_data["PO_Date"] = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else date_val
            
            if "kickoff_date" in milestone_updates:
                date_val = milestone_updates["kickoff_date"]
                if date_val:
                    crm_update_data["Kickoff_Date"] = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else date_val
            
            if "invoice_date" in milestone_updates:
                date_val = milestone_updates["invoice_date"]
                if date_val:
                    crm_update_data["Invoice_Date"] = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else date_val
            
            if "payment_date" in milestone_updates:
                date_val = milestone_updates["payment_date"]
                if date_val:
                    crm_update_data["Payment_Date"] = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else date_val
            
            if "revenue_realization_date" in milestone_updates:
                date_val = milestone_updates["revenue_realization_date"]
                if date_val:
                    crm_update_data["Revenue_Date"] = date_val.strftime("%Y-%m-%d") if isinstance(date_val, datetime) else date_val
            
            if not crm_update_data:
                return {
                    "status": "success",
                    "message": "No milestone updates to sync",
                    "deal_id": opportunity_id
                }
            
            # Update in Zoho CRM
            success = await self.zoho_service.update_deal(opportunity_id, crm_update_data)
            
            if success:
                return {
                    "status": "success",
                    "message": f"Successfully synced milestone updates to CRM",
                    "deal_id": opportunity_id,
                    "updated_fields": list(crm_update_data.keys())
                }
            else:
                return {
                    "status": "error",
                    "message": f"Failed to sync milestone updates to CRM",
                    "deal_id": opportunity_id
                }
                
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error syncing milestone updates to CRM: {str(e)}",
                "deal_id": opportunity_id
            }
    
    async def bulk_sync_deals_to_o2r(self, deals: List[Dict[str, Any]], db: Session) -> Dict[str, Any]:
        """
        Bulk sync multiple deals from SDK to O2R for optimized performance
        """
        try:
            logger.info(f"🚀 Starting bulk O2R sync for {len(deals)} deals")
            
            # Process deals in batches to optimize performance
            batch_size = 50
            processed_count = 0
            failed_count = 0
            o2r_opportunities = []
            
            for i in range(0, len(deals), batch_size):
                batch = deals[i:i + batch_size]
                
                # Process batch
                for deal in batch:
                    try:
                        o2r_opp = await self.sync_deal_to_o2r(deal)
                        if o2r_opp:
                            o2r_opportunities.append(o2r_opp)
                            processed_count += 1
                        else:
                            failed_count += 1
                    except Exception as e:
                        logger.warning(f"Failed to sync deal {deal.get('id', 'unknown')}: {e}")
                        failed_count += 1
                
                # Add small delay between batches
                import asyncio
                await asyncio.sleep(0.1)
            
            logger.info(f"✅ Bulk O2R sync completed: {processed_count} success, {failed_count} failed")
            
            return {
                "status": "success",
                "message": f"Bulk O2R sync completed",
                "processed_count": processed_count,
                "failed_count": failed_count,
                "opportunities": o2r_opportunities
            }
            
        except Exception as e:
            logger.error(f"Bulk O2R sync failed: {e}")
            return {
                "status": "error",
                "message": f"Bulk O2R sync failed: {str(e)}",
                "processed_count": 0,
                "failed_count": len(deals)
            }
