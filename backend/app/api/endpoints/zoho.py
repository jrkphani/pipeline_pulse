"""
Zoho CRM integration endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.core.database import get_db
from app.services.zoho_service import ZohoService

router = APIRouter()


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
    analysis_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Sync analysis results back to Zoho CRM
    """
    
    try:
        zoho_service = ZohoService()
        result = await zoho_service.sync_analysis_to_crm(analysis_id, db)
        
        return {
            "analysis_id": analysis_id,
            "synced": True,
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error syncing to Zoho: {str(e)}")


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
