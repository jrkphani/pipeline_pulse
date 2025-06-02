"""
O2R API Routes - Main endpoints for Opportunity-to-Revenue tracking
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import tempfile
import os

from app.core.database import get_db

from app.models.o2r.opportunity import (
    O2ROpportunity, O2ROpportunityCreate, O2ROpportunityUpdate, 
    O2ROpportunityFilter, OpportunityPhase, HealthSignalType
)
from app.models.o2r.health import HealthSignalEngine
from .import_processor import O2RImportProcessor, O2RBatchProcessor, O2RDataEnricher
from .export_service import O2RExportService
from .review_engine import WeeklyReviewEngine
from .data_bridge import O2RDataBridge

# Create router (prefix will be added by main router)
router = APIRouter(tags=["O2R Tracker"])

# Initialize services
import_processor = O2RImportProcessor()
export_service = O2RExportService()
review_engine = WeeklyReviewEngine()
health_engine = HealthSignalEngine()
data_enricher = O2RDataEnricher()
data_bridge = O2RDataBridge()

# In-memory storage (auto-populated from pipeline data)
opportunities_store: Dict[str, O2ROpportunity] = {}

def populate_opportunities_from_pipeline(db: Session):
    """
    Auto-populate opportunities store from pipeline database
    """
    global opportunities_store

    try:
        # Sync data from pipeline database
        sync_result = data_bridge.sync_pipeline_to_o2r(db)

        if sync_result["status"] == "success":
            # Clear existing store and populate with synced data
            opportunities_store.clear()

            for opp in sync_result["opportunities"]:
                opportunities_store[opp.id] = opp

            print(f"✅ Auto-populated {len(opportunities_store)} opportunities from pipeline data")
        else:
            print(f"⚠️ Failed to auto-populate: {sync_result['message']}")

    except Exception as e:
        print(f"❌ Error auto-populating opportunities: {e}")

# Auto-populate on startup will be done in the sync endpoint

@router.post("/import/csv", response_model=Dict[str, Any])
async def import_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    updated_by: str = "api_user"
):
    """
    Import opportunities from Zoho CRM CSV export
    """
    
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        # Process CSV import
        opportunities = import_processor.process_csv_import(temp_file_path, updated_by)
        
        # Enrich with calculated fields
        opportunities = data_enricher.enrich_opportunities(opportunities)
        
        # Store in memory (replace with database save in production)
        for opp in opportunities:
            opportunities_store[opp.id] = opp
        
        # Generate import summary
        summary = import_processor.generate_import_summary(opportunities)
        
        # Validate data
        validation = import_processor.validate_import_data(opportunities)
        
        return {
            "status": "success",
            "imported_count": len(opportunities),
            "summary": summary,
            "validation": validation,
            "message": f"Successfully imported {len(opportunities)} opportunities"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@router.get("/opportunities", response_model=List[O2ROpportunity])
async def get_opportunities(
    territory: Optional[str] = None,
    service_type: Optional[str] = None,
    funding_type: Optional[str] = None,
    owner: Optional[str] = None,
    current_phase: Optional[OpportunityPhase] = None,
    health_signal: Optional[HealthSignalType] = None,
    strategic_account: Optional[bool] = None,
    requires_attention: Optional[bool] = None,
    updated_this_week: Optional[bool] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    limit: Optional[int] = 100
):
    """
    Get filtered list of O2R opportunities
    """
    
    opportunities = list(opportunities_store.values())
    
    # Apply filters
    if territory:
        opportunities = [opp for opp in opportunities if opp.territory == territory]
    
    if service_type:
        opportunities = [opp for opp in opportunities if opp.service_type == service_type]
    
    if funding_type:
        opportunities = [opp for opp in opportunities if opp.funding_type == funding_type]
    
    if owner:
        opportunities = [opp for opp in opportunities if opp.owner == owner]
    
    if current_phase:
        opportunities = [opp for opp in opportunities if opp.current_phase == current_phase]
    
    if health_signal:
        opportunities = [opp for opp in opportunities if opp.health_signal == health_signal]
    
    if strategic_account is not None:
        opportunities = [opp for opp in opportunities if opp.strategic_account == strategic_account]
    
    if requires_attention is not None:
        opportunities = [opp for opp in opportunities if opp.requires_attention == requires_attention]
    
    if updated_this_week is not None:
        opportunities = [opp for opp in opportunities if opp.updated_this_week == updated_this_week]
    
    if min_amount is not None:
        opportunities = [opp for opp in opportunities if opp.sgd_amount >= min_amount]
    
    if max_amount is not None:
        opportunities = [opp for opp in opportunities if opp.sgd_amount <= max_amount]
    
    # Sort by amount (descending) and limit
    opportunities.sort(key=lambda x: x.sgd_amount, reverse=True)
    
    if limit:
        opportunities = opportunities[:limit]
    
    return opportunities

@router.get("/opportunities/{opportunity_id}", response_model=O2ROpportunity)
async def get_opportunity(opportunity_id: str):
    """
    Get specific opportunity by ID
    """
    
    if opportunity_id not in opportunities_store:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    return opportunities_store[opportunity_id]

@router.put("/opportunities/{opportunity_id}", response_model=O2ROpportunity)
async def update_opportunity(opportunity_id: str, update_data: O2ROpportunityUpdate):
    """
    Update opportunity details and sync to Zoho CRM
    """

    if opportunity_id not in opportunities_store:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    opportunity = opportunities_store[opportunity_id]

    # Store original values for Zoho sync
    original_values = {
        'deal_name': opportunity.deal_name,
        'account_name': opportunity.account_name,
        'owner': opportunity.owner,
        'sgd_amount': opportunity.sgd_amount,
        'probability': opportunity.probability,
        'current_stage': opportunity.current_stage,
        'closing_date': opportunity.closing_date
    }

    # Update fields
    update_dict = update_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        if hasattr(opportunity, field):
            setattr(opportunity, field, value)

    # Update metadata
    opportunity.last_updated = datetime.now()
    opportunity.updated_this_week = True

    # Recalculate health signal
    health_signal = health_engine.calculate_health_signal(opportunity)
    opportunity.health_signal = health_signal.signal
    opportunity.health_reason = health_signal.reason
    opportunity.requires_attention = health_signal.signal in [HealthSignalType.RED, HealthSignalType.BLOCKED]

    # Update phase based on milestones
    opportunity.current_phase = data_enricher._calculate_current_phase(opportunity)

    # Generate action items
    opportunity.action_items = data_enricher._generate_action_items(opportunity)

    # Sync to Zoho CRM if zoho_id exists
    zoho_sync_result = None
    if opportunity.zoho_id:
        try:
            from app.services.zoho_service import ZohoService
            zoho_service = ZohoService()

            # Prepare Zoho update data
            zoho_update_data = {}

            # Map fields that changed
            if 'deal_name' in update_dict:
                zoho_update_data['Deal_Name'] = opportunity.deal_name
            if 'account_name' in update_dict:
                zoho_update_data['Account_Name'] = opportunity.account_name
            if 'owner' in update_dict:
                zoho_update_data['Owner'] = opportunity.owner
            if 'sgd_amount' in update_dict:
                zoho_update_data['Amount'] = opportunity.sgd_amount
            if 'probability' in update_dict:
                zoho_update_data['Probability'] = opportunity.probability
            if 'current_stage' in update_dict:
                zoho_update_data['Stage'] = opportunity.current_stage
            if 'closing_date' in update_dict:
                zoho_update_data['Closing_Date'] = opportunity.closing_date.isoformat() if opportunity.closing_date else None

            # Add O2R specific fields as custom fields
            zoho_update_data['O2R_Health_Signal'] = opportunity.health_signal
            zoho_update_data['O2R_Current_Phase'] = opportunity.current_phase
            zoho_update_data['O2R_Last_Updated'] = opportunity.last_updated.isoformat()

            # Only sync if there are changes
            if zoho_update_data:
                zoho_sync_result = await zoho_service.update_deal(opportunity.zoho_id, zoho_update_data)

        except Exception as e:
            # Log the error but don't fail the update
            print(f"Warning: Failed to sync to Zoho CRM: {e}")
            zoho_sync_result = {"error": str(e)}

    opportunities_store[opportunity_id] = opportunity

    # Add sync result to response (note: we return the opportunity object directly)
    # The zoho_sync_result is logged but not included in the response model

    return opportunity

@router.get("/dashboard/summary", response_model=Dict[str, Any])
async def get_dashboard_summary():
    """
    Get dashboard summary metrics
    """
    
    opportunities = list(opportunities_store.values())
    
    if not opportunities:
        return {
            "total_opportunities": 0,
            "total_value_sgd": 0,
            "message": "No opportunities available"
        }
    
    # Calculate summary metrics
    total_value = sum(opp.sgd_amount for opp in opportunities)
    avg_deal_size = total_value / len(opportunities)
    
    # Phase distribution
    phase_distribution = {}
    for opp in opportunities:
        phase = opp.current_phase
        phase_distribution[phase] = phase_distribution.get(phase, 0) + 1
    
    # Health signal distribution
    health_distribution = health_engine.get_health_summary_for_portfolio(opportunities)
    
    # Territory breakdown
    territory_breakdown = {}
    for opp in opportunities:
        territory = opp.territory or 'Unknown'
        if territory not in territory_breakdown:
            territory_breakdown[territory] = {'count': 0, 'value': 0}
        territory_breakdown[territory]['count'] += 1
        territory_breakdown[territory]['value'] += opp.sgd_amount
    
    # Service type breakdown
    service_breakdown = {}
    for opp in opportunities:
        service = opp.service_type or 'Unknown'
        if service not in service_breakdown:
            service_breakdown[service] = {'count': 0, 'value': 0}
        service_breakdown[service]['count'] += 1
        service_breakdown[service]['value'] += opp.sgd_amount
    
    # Revenue realization tracking
    revenue_realized_value = sum(opp.sgd_amount for opp in opportunities if opp.is_revenue_realized())
    revenue_pending_value = total_value - revenue_realized_value
    
    # Attention required
    attention_opportunities = health_engine.get_opportunities_requiring_attention(opportunities)
    
    return {
        "total_opportunities": len(opportunities),
        "total_value_sgd": total_value,
        "avg_deal_size": avg_deal_size,
        "phase_distribution": phase_distribution,
        "health_distribution": health_distribution,
        "territory_breakdown": territory_breakdown,
        "service_breakdown": service_breakdown,
        "revenue_realization": {
            "realized_value": revenue_realized_value,
            "pending_value": revenue_pending_value,
            "realized_percentage": (revenue_realized_value / total_value) * 100 if total_value > 0 else 0
        },
        "attention_required": {
            "count": len(attention_opportunities),
            "opportunities": [opp.id for opp in attention_opportunities[:5]]  # Top 5
        }
    }

@router.get("/dashboard/territory/{territory}", response_model=Dict[str, Any])
async def get_territory_dashboard(territory: str):
    """
    Get territory-specific dashboard
    """
    
    territory_opportunities = [
        opp for opp in opportunities_store.values() 
        if opp.territory == territory
    ]
    
    if not territory_opportunities:
        raise HTTPException(status_code=404, detail=f"No opportunities found for territory: {territory}")
    
    # Calculate territory metrics
    total_value = sum(opp.sgd_amount for opp in territory_opportunities)
    
    # Health summary
    health_summary = health_engine.get_health_summary_for_portfolio(territory_opportunities)
    
    # Phase progress
    phase_progress = {}
    for opp in territory_opportunities:
        phase = opp.current_phase
        if phase not in phase_progress:
            phase_progress[phase] = {'count': 0, 'value': 0, 'avg_days': 0}
        phase_progress[phase]['count'] += 1
        phase_progress[phase]['value'] += opp.sgd_amount
        phase_progress[phase]['avg_days'] += opp.calculate_days_in_current_phase()
    
    # Calculate averages
    for phase_data in phase_progress.values():
        if phase_data['count'] > 0:
            phase_data['avg_days'] = phase_data['avg_days'] / phase_data['count']
    
    # Top deals
    top_deals = sorted(territory_opportunities, key=lambda x: x.sgd_amount, reverse=True)[:5]
    
    # Attention required
    attention_deals = health_engine.get_opportunities_requiring_attention(territory_opportunities)
    
    return {
        "territory": territory,
        "total_opportunities": len(territory_opportunities),
        "total_value_sgd": total_value,
        "health_summary": health_summary,
        "phase_progress": phase_progress,
        "top_deals": [{"id": opp.id, "name": opp.deal_name, "value": opp.sgd_amount} for opp in top_deals],
        "attention_required": [{"id": opp.id, "name": opp.deal_name, "reason": opp.health_reason} for opp in attention_deals]
    }

@router.get("/weekly-review", response_model=Dict[str, Any])
async def get_weekly_review(week_of: Optional[str] = None):
    """
    Get weekly review dashboard
    """
    
    # Parse week date or use current week
    if week_of:
        try:
            week_date = datetime.strptime(week_of, '%Y-%m-%d').date()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        week_date = datetime.now().date()
    
    opportunities = list(opportunities_store.values())
    
    # Generate weekly review
    weekly_review = review_engine.prepare_weekly_review(opportunities, week_date)
    
    return weekly_review

@router.get("/export/slide/{opportunity_id}")
async def export_opportunity_slide(opportunity_id: str):
    """
    Export opportunity as slide (PDF)
    """
    
    if opportunity_id not in opportunities_store:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    opportunity = opportunities_store[opportunity_id]
    
    # Generate slide PDF
    pdf_bytes = export_service.generate_opportunity_slide(opportunity)
    
    return {
        "filename": f"{opportunity.deal_name}_slide.pdf",
        "content": pdf_bytes
    }

@router.get("/export/deck/territory/{territory}")
async def export_territory_deck(territory: str):
    """
    Export territory deck (PowerPoint)
    """
    
    territory_opportunities = [
        opp for opp in opportunities_store.values() 
        if opp.territory == territory
    ]
    
    if not territory_opportunities:
        raise HTTPException(status_code=404, detail=f"No opportunities found for territory: {territory}")
    
    # Generate deck
    deck_bytes = export_service.generate_territory_deck(territory, territory_opportunities)
    
    return {
        "filename": f"{territory}_O2R_Deck.pptx",
        "content": deck_bytes
    }

@router.post("/refresh-health-signals")
async def refresh_health_signals():
    """
    Refresh health signals for all opportunities
    """
    
    updated_count = 0
    
    for opp in opportunities_store.values():
        # Recalculate health signal
        health_signal = health_engine.calculate_health_signal(opp)
        opp.health_signal = health_signal.signal
        opp.health_reason = health_signal.reason
        opp.requires_attention = health_signal.signal in [HealthSignalType.RED, HealthSignalType.BLOCKED]
        
        # Update weekly status
        opp.updated_this_week = data_enricher._was_updated_this_week(opp)
        
        updated_count += 1
    
    return {
        "status": "success",
        "updated_count": updated_count,
        "message": f"Refreshed health signals for {updated_count} opportunities"
    }

@router.get("/health-recommendations/{opportunity_id}", response_model=List[str])
async def get_health_recommendations(opportunity_id: str):
    """
    Get health recommendations for specific opportunity
    """
    
    if opportunity_id not in opportunities_store:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    
    opportunity = opportunities_store[opportunity_id]
    
    recommendations = health_engine.generate_health_recommendations(opportunity)
    
    return recommendations

@router.get("/sample-csv-template")
async def download_sample_csv_template():
    """
    Download sample CSV template for Zoho CRM export
    """
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as temp_file:
        temp_file_path = temp_file.name
    
    # Generate template
    import_processor.export_sample_csv_template(temp_file_path)
    
    # Read file content
    with open(temp_file_path, 'rb') as f:
        content = f.read()
    
    # Clean up
    os.unlink(temp_file_path)
    
    return {
        "filename": "zoho_crm_o2r_template.csv",
        "content": content
    }

# Additional utility endpoints
@router.get("/territories", response_model=List[str])
async def get_territories():
    """Get list of all territories"""
    territories = set()
    for opp in opportunities_store.values():
        if opp.territory:
            territories.add(opp.territory)
    return sorted(list(territories))

@router.get("/service-types", response_model=List[str])
async def get_service_types():
    """Get list of all service types"""
    service_types = set()
    for opp in opportunities_store.values():
        if opp.service_type:
            service_types.add(opp.service_type)
    return sorted(list(service_types))

@router.get("/owners", response_model=List[str])
async def get_owners():
    """Get list of all opportunity owners"""
    owners = set()
    for opp in opportunities_store.values():
        if opp.owner:
            owners.add(opp.owner)
    return sorted(list(owners))

@router.post("/sync-from-pipeline")
async def sync_from_pipeline(db: Session = Depends(get_db)):
    """
    Manually sync opportunities from pipeline database
    """
    try:
        populate_opportunities_from_pipeline(db)

        return {
            "status": "success",
            "message": f"Successfully synced {len(opportunities_store)} opportunities from pipeline data",
            "total_opportunities": len(opportunities_store)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
