"""
Zoho CRM integration endpoints with live sync
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.core.database import get_db
from app.services.zoho_service import ZohoService
from app.services.enhanced_zoho_service import EnhancedZohoService
from app.services.data_sync_service import DataSyncService

router = APIRouter()

# Initialize services
data_sync_service = DataSyncService()


@router.get("/deals")
async def get_zoho_deals(
    limit: int = 100,
    offset: int = 0
) -> Dict[str, Any]:
    """
    Fetch deals from Zoho CRM
    """
    
    try:
        zoho_service = ZohoService()
        deals = await zoho_service.get_deals(limit=limit, offset=offset)
        
        return {
            "deals": deals,
            "total": len(deals),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching Zoho deals: {str(e)}")


@router.put("/deals/{deal_id}")
async def update_zoho_deal(
    deal_id: str,
    deal_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update a deal in Zoho CRM
    """
    
    try:
        zoho_service = ZohoService()
        result = await zoho_service.update_deal(deal_id, deal_data)
        
        return {
            "deal_id": deal_id,
            "updated": True,
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating Zoho deal: {str(e)}")


@router.post("/sync")
async def sync_with_zoho(
    background_tasks: BackgroundTasks,
    sync_type: str = "full"
) -> Dict[str, Any]:
    """
    Trigger manual sync with Zoho CRM
    """
    
    try:
        if sync_type == "full":
            result = await data_sync_service.full_sync()
        else:
            result = await data_sync_service.delta_sync()
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing with Zoho: {str(e)}")


@router.get("/live-pipeline")
async def get_live_pipeline_data(
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get live pipeline data with sync status
    """
    
    try:
        # Get latest analysis (which now contains live CRM data)
        from app.models.analysis import Analysis
        latest_analysis = db.query(Analysis).order_by(Analysis.upload_time.desc()).first()
        
        if not latest_analysis:
            return {
                "deals": [],
                "summary": {
                    "total_deals": 0,
                    "total_value": 0,
                    "avg_probability": 0,
                    "deals_by_stage": {}
                },
                "syncStatus": {
                    "lastSync": None,
                    "isConnected": False,
                    "syncInProgress": data_sync_service.sync_in_progress,
                    "nextSyncIn": 900  # 15 minutes in seconds
                }
            }
        
        # Calculate summary
        deals = latest_analysis.deals or []
        total_value = sum(deal.get("sgd_amount", 0) for deal in deals)
        avg_probability = sum(deal.get("probability", 0) for deal in deals) / len(deals) if deals else 0
        
        # Group by stage
        deals_by_stage = {}
        for deal in deals:
            stage = deal.get("stage", "Unknown")
            if stage not in deals_by_stage:
                deals_by_stage[stage] = {"count": 0, "value": 0}
            deals_by_stage[stage]["count"] += 1
            deals_by_stage[stage]["value"] += deal.get("sgd_amount", 0)
        
        return {
            "deals": deals,
            "summary": {
                "total_deals": len(deals),
                "total_value": total_value,
                "avg_probability": avg_probability,
                "deals_by_stage": deals_by_stage
            },
            "syncStatus": {
                "lastSync": data_sync_service.last_sync_time.isoformat() if data_sync_service.last_sync_time else None,
                "isConnected": True,
                "syncInProgress": data_sync_service.sync_in_progress,
                "nextSyncIn": 900  # 15 minutes in seconds
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching live pipeline: {str(e)}")


@router.get("/status")
async def get_sync_status() -> Dict[str, Any]:
    """
    Get current sync status
    """
    
    return {
        "lastSync": data_sync_service.last_sync_time.isoformat() if data_sync_service.last_sync_time else None,
        "syncInProgress": data_sync_service.sync_in_progress,
        "isConnected": data_sync_service.last_sync_time is not None,
        "nextSyncIn": 900  # 15 minutes in seconds
    }


@router.post("/webhook")
async def handle_zoho_webhook(
    webhook_data: Dict[str, Any],
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Handle Zoho CRM webhooks for real-time updates
    """
    
    try:
        # Validate webhook token
        token = webhook_data.get("token")
        if token != "your_webhook_secret":  # Should come from settings
            raise HTTPException(status_code=401, detail="Invalid webhook token")
        
        # Process webhook event
        event_type = webhook_data.get("event_type")
        deal_data = webhook_data.get("data")
        
        if event_type in ["Deals.create", "Deals.edit", "Deals.delete"]:
            # Trigger delta sync in background
            background_tasks.add_task(data_sync_service.delta_sync)
        
        return {"status": "accepted", "event": event_type}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing webhook: {str(e)}")


@router.get("/auth/status")
async def get_auth_status() -> Dict[str, Any]:
    """
    Check Zoho authentication status
    """

    try:
        zoho_service = ZohoService()
        is_authenticated = await zoho_service.check_auth()

        return {
            "authenticated": is_authenticated,
            "service": "Zoho CRM"
        }

    except Exception as e:
        return {
            "authenticated": False,
            "error": str(e),
            "service": "Zoho CRM"
        }


@router.post("/auth/exchange-code")
async def exchange_authorization_code(
    code: str,
    client_id: str = "1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH",
    client_secret: str = "c1fe544d4217d145016d2b03ee78afa084498e04f4"
) -> Dict[str, Any]:
    """
    Exchange authorization code for refresh token
    """

    try:
        zoho_service = ZohoService()
        result = await zoho_service.exchange_code_for_tokens(code, client_id, client_secret)

        return {
            "success": True,
            "message": "Authorization code exchanged successfully",
            "result": result
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error exchanging code: {str(e)}")


@router.get("/auth/url")
async def get_auth_url() -> Dict[str, Any]:
    """
    Get Zoho authorization URL for India data center
    """

    import urllib.parse

    client_id = "1000.5D3QB5PNVW1G3TIM26OX73VX34GRMH"

    scopes = [
        "ZohoCRM.modules.ALL",
        "ZohoCRM.settings.ALL",
        "ZohoCRM.users.ALL",
        "ZohoCRM.org.ALL",
        "ZohoCRM.bulk.ALL"
    ]

    params = {
        "scope": ",".join(scopes),
        "client_id": client_id,
        "response_type": "code",
        "access_type": "offline",
        "redirect_uri": "http://localhost:8000/auth/callback"
    }

    base_url = "https://accounts.zoho.in/oauth/v2/auth"
    auth_url = f"{base_url}?" + urllib.parse.urlencode(params)

    return {
        "auth_url": auth_url,
        "instructions": [
            "1. Visit the auth_url in your browser",
            "2. Log in to your Zoho account",
            "3. Grant permissions",
            "4. Copy the 'code' parameter from the callback URL",
            "5. Use the code with the /auth/exchange-code endpoint"
        ]
    }
