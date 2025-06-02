"""
O2R Import Processor - Handles Zoho CRM data import with async bulk operations
Enhanced to use unified CRM service instead of CSV processing
"""

import pandas as pd
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from pathlib import Path
from sqlalchemy.orm import Session

from app.models.o2r.opportunity import (
    O2ROpportunity, O2ROpportunityCreate, OpportunityPhase, HealthSignalType
)
from app.models.o2r.health import HealthSignalEngine
from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService

class O2RImportProcessor:
    """Processes Zoho CRM data into O2R opportunities using unified CRM service"""

    def __init__(self, db: Optional[Session] = None):
        self.health_engine = HealthSignalEngine()
        self.db = db
        self.crm_service = UnifiedZohoCRMService(db) if db else None
        
        # Field mapping from Zoho CSV to O2R model
        self.field_mapping = {
            'Record Id': 'zoho_id',
            'Opportunity Name': 'deal_name',
            'Account Name': 'account_name',
            'Opportunity Owner': 'owner',
            'OCH Revenue': 'sgd_amount',  # Already converted to SGD
            'Probability (%)': 'probability',
            'Stage': 'current_stage',
            'Closing Date': 'closing_date',
            'Created Time': 'created_date',
            'Country': 'country',
            'Business Region': 'territory',
            'Solution Type': 'service_type',
            'Type of Funding': 'funding_type',
            'Market Segment': 'market_segment',
            'Proposal Submission date': 'proposal_date',
            'PO Generation Date': 'po_date',
            'Kick-off Date': 'kickoff_date',
            'Invoice Date': 'invoice_date',
            'Received On': 'payment_date',
            'OB Recognition Date': 'revenue_date'
        }
    
    def process_csv_import(self, csv_file_path: str, updated_by: str = "system") -> List[O2ROpportunity]:
        """Process Zoho CRM CSV and create O2R opportunities"""
        
        # Read and validate CSV
        df = self._read_and_validate_csv(csv_file_path)
        
        # Apply data quality filters (reuse Pipeline Pulse logic)
        df = self._apply_quality_filters(df)
        
        # Process each row into O2R opportunity
        opportunities = []
        for index, row in df.iterrows():
            try:
                opp = self._create_o2r_opportunity(row, updated_by)
                opportunities.append(opp)
            except Exception as e:
                print(f"Error processing row {index}: {e}")
                continue
        
        return opportunities

    async def import_from_zoho_crm(
        self,
        criteria: Optional[str] = None,
        updated_by: str = "zoho_import"
    ) -> List[O2ROpportunity]:
        """
        Import opportunities directly from Zoho CRM using unified service
        This replaces CSV-based imports with direct API integration
        """

        if not self.crm_service:
            raise ValueError("CRM service not initialized. Provide database session in constructor.")

        try:
            # Fetch deals from Zoho CRM with specific criteria for O2R tracking
            if not criteria:
                # Default criteria for active deals suitable for O2R tracking
                criteria = "(Probability:greater_than:10) and (Probability:less_than:90) and (Amount:greater_than:0)"

            # Get deals from Zoho CRM
            deals = await self.crm_service.get_deals(
                limit=1000,  # Adjust as needed
                criteria=criteria,
                fields=[
                    "id", "Deal_Name", "Account_Name", "Owner", "Amount", "Currency",
                    "Probability", "Stage", "Closing_Date", "Created_Time", "Modified_Time",
                    "Country", "Territory", "Service_Type", "Funding_Type", "Market_Segment"
                ]
            )

            # Convert Zoho deals to O2R opportunities
            opportunities = []
            for deal in deals:
                try:
                    opp = self._create_o2r_from_zoho_deal(deal, updated_by)
                    opportunities.append(opp)
                except Exception as e:
                    print(f"Error processing deal {deal.get('id', 'unknown')}: {e}")
                    continue

            return opportunities

        except Exception as e:
            print(f"Error importing from Zoho CRM: {e}")
            raise

    def _create_o2r_from_zoho_deal(self, deal: Dict[str, Any], updated_by: str) -> O2ROpportunity:
        """
        Create O2R opportunity from Zoho CRM deal data
        """

        opp_id = str(uuid.uuid4())

        # Extract and convert deal data
        deal_name = deal.get('Deal_Name', 'Unknown Deal')
        account_name = deal.get('Account_Name', 'Unknown Account')
        owner = deal.get('Owner', {}).get('name', 'Unknown Owner') if isinstance(deal.get('Owner'), dict) else str(deal.get('Owner', 'Unknown Owner'))

        # Handle amount and currency
        amount = float(deal.get('Amount', 0))
        currency = deal.get('Currency', 'SGD')

        # Convert to SGD if needed (you may want to use your currency service here)
        sgd_amount = amount  # Simplified - implement currency conversion as needed

        # Extract other fields
        probability = int(deal.get('Probability', 50))
        stage = deal.get('Stage', 'Unknown')
        territory = deal.get('Territory', deal.get('Country', 'Unknown'))
        service_type = deal.get('Service_Type', 'Unknown')
        funding_type = deal.get('Funding_Type', 'Unknown')

        # Parse dates
        closing_date = self._parse_zoho_date(deal.get('Closing_Date'))
        created_date = self._parse_zoho_date(deal.get('Created_Time'))

        # Determine current phase based on stage
        current_phase = self._map_stage_to_phase(stage)

        # Create O2R opportunity
        opportunity = O2ROpportunity(
            id=opp_id,
            zoho_id=deal.get('id'),
            deal_name=deal_name,
            account_name=account_name,
            owner=owner,
            sgd_amount=sgd_amount,
            probability=probability,
            current_stage=stage,
            closing_date=closing_date.date() if isinstance(closing_date, datetime) else (closing_date or datetime.now().date()),
            created_date=created_date or datetime.now(),
            country=territory,
            territory=territory,
            service_type=service_type,
            funding_type=funding_type,
            market_segment=deal.get('Market_Segment', 'Unknown'),
            updated_by=updated_by,

            # O2R specific fields
            current_phase=current_phase,
            strategic_account=sgd_amount > 1000000,  # Strategic if > 1M SGD

            # Milestone dates (to be enriched from Zoho data)
            proposal_date=None,
            po_date=None,
            kickoff_date=None,
            invoice_date=None,
            payment_date=None,
            revenue_date=None,

            # Health and tracking (will be calculated)
            health_signal=HealthSignalType.YELLOW,
            health_reason="Imported from Zoho CRM",
            requires_attention=False,
            updated_this_week=False,
            last_updated=datetime.now(),

            # Additional fields
            comments=None,
            action_items=[]
        )

        # Calculate health signal
        health_signal = self.health_engine.calculate_health_signal(opportunity)
        opportunity.health_signal = health_signal.signal
        opportunity.health_reason = health_signal.reason
        opportunity.requires_attention = health_signal.signal in [
            HealthSignalType.RED, HealthSignalType.BLOCKED
        ]

        return opportunity

    def _parse_zoho_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse Zoho date string to datetime object"""

        if not date_str:
            return None

        try:
            # Zoho typically returns dates in ISO format
            if 'T' in date_str:
                return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                return datetime.strptime(date_str, '%Y-%m-%d')
        except (ValueError, TypeError):
            return None

    def _map_stage_to_phase(self, stage: str) -> OpportunityPhase:
        """Map Zoho stage to O2R phase"""

        stage_lower = stage.lower()

        if any(keyword in stage_lower for keyword in ['qualification', 'discovery', 'initial']):
            return OpportunityPhase.PHASE_1
        elif any(keyword in stage_lower for keyword in ['proposal', 'quote', 'negotiation']):
            return OpportunityPhase.PHASE_2
        elif any(keyword in stage_lower for keyword in ['contract', 'agreement', 'legal']):
            return OpportunityPhase.PHASE_2
        elif any(keyword in stage_lower for keyword in ['delivery', 'implementation', 'execution']):
            return OpportunityPhase.PHASE_3
        elif any(keyword in stage_lower for keyword in ['closed', 'won', 'complete']):
            return OpportunityPhase.PHASE_4
        else:
            return OpportunityPhase.PHASE_1  # Default
    
    def _read_and_validate_csv(self, csv_file_path: str) -> pd.DataFrame:
        """Read CSV and validate required fields"""
        
        # Read CSV
        df = pd.read_csv(csv_file_path)
        
        # Check for required fields
        required_fields = [
            'Record Id', 'Opportunity Name', 'Account Name', 
            'Opportunity Owner', 'OCH Revenue', 'Probability (%)',
            'Stage', 'Closing Date', 'Country'
        ]
        
        missing_fields = [field for field in required_fields if field not in df.columns]
        if missing_fields:
            raise ValueError(f"Missing required fields: {missing_fields}")
        
        print(f"Successfully loaded {len(df)} opportunities from CSV")
        print(f"Available fields: {list(df.columns)}")
        
        return df
    
    def _apply_quality_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply data quality filters (from Pipeline Pulse)"""
        
        initial_count = len(df)
        
        # Filter out deals without actual revenue
        df = df[df['OCH Revenue'].notna() & (df['OCH Revenue'] > 0)]
        
        # Filter probability range (10-89% for active deals)
        df = df[(df['Probability (%)'] >= 10) & (df['Probability (%)'] <= 89)]
        
        # Remove test/placeholder deals
        test_keywords = ['test', 'demo', 'placeholder', 'sample']
        for keyword in test_keywords:
            df = df[~df['Opportunity Name'].str.contains(keyword, case=False, na=False)]
        
        filtered_count = len(df)
        print(f"Applied quality filters: {initial_count} → {filtered_count} opportunities")
        
        return df
    
    def _create_o2r_opportunity(self, row: pd.Series, updated_by: str) -> O2ROpportunity:
        """Create O2R opportunity from CSV row"""
        
        # Generate unique ID
        opp_id = str(uuid.uuid4())
        
        # Map basic fields
        opp_data = {}
        for csv_field, model_field in self.field_mapping.items():
            if csv_field in row.index and pd.notna(row[csv_field]):
                value = row[csv_field]
                
                # Handle date fields
                if model_field.endswith('_date') and model_field != 'created_date':
                    value = self._parse_date(value)
                elif model_field == 'created_date':
                    value = self._parse_datetime(value)
                elif model_field == 'sgd_amount':
                    value = float(value) if pd.notna(value) else 0
                elif model_field == 'probability':
                    value = int(value) if pd.notna(value) else 0
                
                opp_data[model_field] = value
        
        # Add required fields
        opp_data.update({
            'id': opp_id,
            'updated_by': updated_by,
            'strategic_account': self._determine_strategic_account(row),
            'current_phase': self._determine_current_phase(opp_data),
            'last_updated': datetime.now()
        })
        
        # Create opportunity object
        opportunity = O2ROpportunity(**opp_data)
        
        # Calculate health signal
        health_signal = self.health_engine.calculate_health_signal(opportunity)
        opportunity.health_signal = health_signal.signal
        opportunity.health_reason = health_signal.reason
        
        # Set attention flags
        opportunity.requires_attention = health_signal.signal in [
            HealthSignalType.RED, HealthSignalType.BLOCKED
        ]
        
        return opportunity
    
    def _determine_strategic_account(self, row: pd.Series) -> bool:
        """Determine if account is strategic (workaround for missing field)"""
        
        # Check for strategic account indicators in account name
        strategic_keywords = [
            'AWS', 'Microsoft', 'Google', 'Oracle', 'SAP', 'Salesforce',
            'Government', 'Ministry', 'Bank', 'DBS', 'OCBC', 'UOB'
        ]
        
        account_name = str(row.get('Account Name', '')).upper()
        return any(keyword.upper() in account_name for keyword in strategic_keywords)
    
    def _determine_current_phase(self, opp_data: Dict[str, Any]) -> OpportunityPhase:
        """Determine current O2R phase based on milestone completion"""
        
        # Phase 4: Revenue realization (highest priority)
        if opp_data.get('kickoff_date'):
            return OpportunityPhase.PHASE_4
        
        # Phase 3: Execution
        if opp_data.get('po_date'):
            return OpportunityPhase.PHASE_3
        
        # Phase 2: Proposal to commitment
        if opp_data.get('proposal_date'):
            return OpportunityPhase.PHASE_2
        
        # Phase 1: Opportunity to proposal (default)
        return OpportunityPhase.PHASE_1
    
    def _parse_date(self, date_str: str) -> Optional[date]:
        """Parse date string to date object"""
        if pd.isna(date_str) or date_str == '':
            return None
        
        # Common date formats
        date_formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%d-%m-%Y',
            '%Y-%m-%d %H:%M:%S',
            '%d/%m/%Y %H:%M:%S'
        ]
        
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(str(date_str), fmt).date()
                return parsed_date
            except ValueError:
                continue
        
        print(f"Warning: Could not parse date '{date_str}'")
        return None
    
    def _parse_datetime(self, datetime_str: str) -> Optional[datetime]:
        """Parse datetime string to datetime object"""
        if pd.isna(datetime_str) or datetime_str == '':
            return None
        
        # Common datetime formats
        datetime_formats = [
            '%Y-%m-%d %H:%M:%S',
            '%d/%m/%Y %H:%M:%S',
            '%m/%d/%Y %H:%M:%S',
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%m/%d/%Y'
        ]
        
        for fmt in datetime_formats:
            try:
                parsed_datetime = datetime.strptime(str(datetime_str), fmt)
                return parsed_datetime
            except ValueError:
                continue
        
        print(f"Warning: Could not parse datetime '{datetime_str}'")
        return datetime.now()  # Fallback to current time
    
    def generate_import_summary(self, opportunities: List[O2ROpportunity]) -> Dict[str, Any]:
        """Generate summary of import results"""
        
        if not opportunities:
            return {
                'total_imported': 0,
                'message': 'No opportunities imported'
            }
        
        # Basic counts
        summary = {
            'total_imported': len(opportunities),
            'total_value_sgd': sum(opp.sgd_amount for opp in opportunities),
            'avg_deal_size': sum(opp.sgd_amount for opp in opportunities) / len(opportunities)
        }
        
        # Phase distribution
        phase_counts = {}
        for opp in opportunities:
            phase = opp.current_phase
            phase_counts[phase] = phase_counts.get(phase, 0) + 1
        summary['phase_distribution'] = phase_counts
        
        # Health signal distribution
        health_summary = self.health_engine.get_health_summary_for_portfolio(opportunities)
        summary['health_distribution'] = health_summary
        
        # Territory breakdown
        territory_counts = {}
        for opp in opportunities:
            territory = opp.territory or 'Unknown'
            territory_counts[territory] = territory_counts.get(territory, 0) + 1
        summary['territory_distribution'] = territory_counts
        
        # Service type breakdown
        service_counts = {}
        for opp in opportunities:
            service = opp.service_type or 'Unknown'
            service_counts[service] = service_counts.get(service, 0) + 1
        summary['service_type_distribution'] = service_counts
        
        # AWS funding breakdown
        aws_funded = sum(1 for opp in opportunities if opp.funding_type and 'AWS' in opp.funding_type)
        summary['aws_funded_deals'] = aws_funded
        summary['aws_funded_percentage'] = (aws_funded / len(opportunities)) * 100
        
        # Strategic accounts
        strategic_count = sum(1 for opp in opportunities if opp.strategic_account)
        summary['strategic_accounts'] = strategic_count
        summary['strategic_percentage'] = (strategic_count / len(opportunities)) * 100
        
        # Revenue realization status
        revenue_realized = sum(1 for opp in opportunities if opp.is_revenue_realized())
        summary['revenue_realized_deals'] = revenue_realized
        summary['revenue_realized_percentage'] = (revenue_realized / len(opportunities)) * 100
        
        # Attention required
        attention_required = sum(1 for opp in opportunities if opp.requires_attention)
        summary['attention_required'] = attention_required
        
        return summary
    
    def validate_import_data(self, opportunities: List[O2ROpportunity]) -> Dict[str, Any]:
        """Validate imported data and identify potential issues"""
        
        validation_results = {
            'total_opportunities': len(opportunities),
            'validation_passed': True,
            'warnings': [],
            'errors': []
        }
        
        for opp in opportunities:
            # Check for missing critical data
            if not opp.owner:
                validation_results['warnings'].append(f"Missing owner for deal: {opp.deal_name}")
            
            if opp.sgd_amount <= 0:
                validation_results['warnings'].append(f"Zero/negative amount for deal: {opp.deal_name}")
            
            if not opp.territory:
                validation_results['warnings'].append(f"Missing territory for deal: {opp.deal_name}")
            
            # Check date consistency
            if opp.proposal_date and opp.po_date and opp.proposal_date > opp.po_date:
                validation_results['errors'].append(f"Proposal date after PO date for deal: {opp.deal_name}")
            
            if opp.po_date and opp.kickoff_date and opp.po_date > opp.kickoff_date:
                validation_results['errors'].append(f"PO date after kickoff date for deal: {opp.deal_name}")
            
            if opp.invoice_date and opp.payment_date and opp.invoice_date > opp.payment_date:
                validation_results['errors'].append(f"Invoice date after payment date for deal: {opp.deal_name}")
        
        if validation_results['errors']:
            validation_results['validation_passed'] = False
        
        return validation_results
    
    def export_sample_csv_template(self, file_path: str) -> None:
        """Export a sample CSV template for Zoho CRM export"""
        
        template_data = {
            'Record Id': ['123456789', '987654321'],
            'Opportunity Name': ['Sample Deal 1', 'Sample Deal 2'],
            'Account Name': ['ABC Corp', 'XYZ Ltd'],
            'OCH Revenue': [100000, 250000],
            'Currency': ['SGD', 'USD'],
            'Exchange Rate': [1.0, 0.75],
            'Probability (%)': [75, 60],
            'Stage': ['Proposal Sent', 'Negotiation'],
            'Closing Date': ['2025-07-15', '2025-08-30'],
            'Opportunity Owner': ['John Doe', 'Jane Smith'],
            'Created Time': ['2025-01-15 10:30:00', '2025-02-01 14:20:00'],
            'Country': ['Singapore', 'Malaysia'],
            'Business Region': ['APAC', 'APAC'],
            'Solution Type': ['MSP', 'Gen AI'],
            'Type of Funding': ['AWS CPPO', 'Self-funded'],
            'Market Segment': ['Enterprise', 'SMB'],
            'Proposal Submission date': ['2025-03-01', '2025-03-15'],
            'PO Generation Date': ['', '2025-04-01'],
            'Kick-off Date': ['', ''],
            'Invoice Date': ['', ''],
            'Received On': ['', ''],
            'OB Recognition Date': ['', '']
        }
        
        df = pd.DataFrame(template_data)
        df.to_csv(file_path, index=False)
        print(f"Sample CSV template exported to: {file_path}")

class O2RBatchProcessor:
    """Handles batch processing of multiple CSV files"""
    
    def __init__(self):
        self.import_processor = O2RImportProcessor()
    
    def process_multiple_files(self, file_paths: List[str], updated_by: str = "system") -> Dict[str, Any]:
        """Process multiple CSV files and combine results"""
        
        all_opportunities = []
        file_results = {}
        
        for file_path in file_paths:
            try:
                opportunities = self.import_processor.process_csv_import(file_path, updated_by)
                all_opportunities.extend(opportunities)
                
                file_results[file_path] = {
                    'success': True,
                    'count': len(opportunities),
                    'summary': self.import_processor.generate_import_summary(opportunities)
                }
                
            except Exception as e:
                file_results[file_path] = {
                    'success': False,
                    'error': str(e),
                    'count': 0
                }
        
        # Generate combined summary
        combined_summary = self.import_processor.generate_import_summary(all_opportunities)
        
        return {
            'total_opportunities': len(all_opportunities),
            'file_results': file_results,
            'combined_summary': combined_summary,
            'opportunities': all_opportunities
        }
    
    def process_directory(self, directory_path: str, updated_by: str = "system") -> Dict[str, Any]:
        """Process all CSV files in a directory"""
        
        directory = Path(directory_path)
        csv_files = list(directory.glob("*.csv"))
        
        if not csv_files:
            return {
                'total_opportunities': 0,
                'message': f'No CSV files found in {directory_path}'
            }
        
        file_paths = [str(f) for f in csv_files]
        return self.process_multiple_files(file_paths, updated_by)

class O2RDataEnricher:
    """Enriches O2R data with additional calculated fields"""
    
    def enrich_opportunities(self, opportunities: List[O2ROpportunity]) -> List[O2ROpportunity]:
        """Enrich opportunities with calculated fields"""
        
        for opp in opportunities:
            # Update current phase based on milestones
            opp.current_phase = self._calculate_current_phase(opp)
            
            # Calculate weekly update status
            opp.updated_this_week = self._was_updated_this_week(opp)
            
            # Generate action items
            opp.action_items = self._generate_action_items(opp)
            
            # Update health signal
            health_engine = HealthSignalEngine()
            health_signal = health_engine.calculate_health_signal(opp)
            opp.health_signal = health_signal.signal
            opp.health_reason = health_signal.reason
            opp.requires_attention = health_signal.signal in [HealthSignalType.RED, HealthSignalType.BLOCKED]
        
        return opportunities
    
    def _calculate_current_phase(self, opp: O2ROpportunity) -> OpportunityPhase:
        """Calculate current phase based on milestone completion"""
        
        if opp.revenue_date:
            return OpportunityPhase.PHASE_4
        elif opp.invoice_date or opp.payment_date:
            return OpportunityPhase.PHASE_4
        elif opp.kickoff_date:
            return OpportunityPhase.PHASE_3
        elif opp.po_date:
            return OpportunityPhase.PHASE_3
        elif opp.proposal_date:
            return OpportunityPhase.PHASE_2
        else:
            return OpportunityPhase.PHASE_1
    
    def _was_updated_this_week(self, opp: O2ROpportunity) -> bool:
        """Check if opportunity was updated this week"""
        
        from datetime import datetime, timedelta
        
        # Get start of current week (Monday)
        today = datetime.now().date()
        days_since_monday = today.weekday()
        week_start = today - timedelta(days=days_since_monday)
        
        return opp.last_updated.date() >= week_start
    
    def _generate_action_items(self, opp: O2ROpportunity) -> List[str]:
        """Generate action items based on opportunity status"""
        
        action_items = []
        
        # Next milestone based action items
        next_milestone = opp.get_next_milestone()
        
        if next_milestone == "proposal_sent":
            action_items.append("Prepare and send proposal to customer")
        elif next_milestone == "po_received":
            action_items.append("Follow up on proposal acceptance and PO generation")
        elif next_milestone == "kickoff_complete":
            action_items.append("Schedule project kickoff meeting")
        elif next_milestone == "invoice_raised":
            action_items.append("Prepare invoice for completed work")
        elif next_milestone == "payment_received":
            action_items.append("Follow up on payment collection")
        elif next_milestone == "revenue_recognized":
            action_items.append("Complete revenue recognition process")
        
        # Health-based action items
        if opp.health_signal == HealthSignalType.RED:
            action_items.append("URGENT: Address critical issues immediately")
        elif opp.health_signal == HealthSignalType.YELLOW:
            action_items.append("Review and address potential delays")
        elif opp.health_signal == HealthSignalType.BLOCKED:
            action_items.append("Resolve blockers to continue progress")
        
        # AWS funding specific
        if opp.funding_type and 'AWS' in opp.funding_type:
            action_items.append("Ensure AWS compliance and reporting")
        
        return action_items
