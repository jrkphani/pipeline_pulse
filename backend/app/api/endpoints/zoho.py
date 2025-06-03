"""
Zoho CRM integration endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional

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


@router.get("/auth/check")
async def check_zoho_auth() -> Dict[str, Any]:
    """
    Check if Zoho authentication is working
    """

    try:
        zoho_service = ZohoService()
        is_authenticated = await zoho_service.check_auth()

        if not is_authenticated:
            raise HTTPException(status_code=401, detail="Zoho CRM authentication failed")

        return {
            "authenticated": is_authenticated,
            "message": "Authentication successful"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking authentication: {str(e)}")


@router.post("/auth/exchange-code")
async def exchange_authorization_code(
    code: str
) -> Dict[str, Any]:
    """
    Exchange authorization code for refresh token using current environment credentials
    """
    from app.core.config import settings
    import logging

    try:
        # Debug logging to see what credentials are being used
        logging.info(f"Using client_id: {settings.ZOHO_CLIENT_ID}")
        logging.info(f"Using client_secret: {settings.ZOHO_CLIENT_SECRET[:10]}...")  # Only log first 10 chars for security

        zoho_service = ZohoService()
        result = await zoho_service.exchange_code_for_tokens(
            code,
            settings.ZOHO_CLIENT_ID,
            settings.ZOHO_CLIENT_SECRET
        )

        # Check if the result contains an error
        if isinstance(result, dict) and "error" in result:
            return {
                "success": False,
                "message": "Authorization code exchange failed",
                "result": result,
                "debug_info": {
                    "client_id": settings.ZOHO_CLIENT_ID,
                    "client_secret_prefix": settings.ZOHO_CLIENT_SECRET[:10] + "..."
                },
                "instructions": [
                    "The authorization code exchange failed",
                    "Please check that the client credentials match the authorization code",
                    "Generate a new authorization code if needed"
                ]
            }

        return {
            "success": True,
            "message": "Authorization code exchanged successfully",
            "result": result,
            "instructions": [
                "Copy the 'refresh_token' from the result above",
                "Update your .env file with: ZOHO_REFRESH_TOKEN=<refresh_token>",
                "Restart the backend server to use the new token"
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error exchanging code: {str(e)}")


@router.get("/auth/url")
async def get_auth_url() -> Dict[str, Any]:
    """
    Get Zoho authorization URL for India data center
    """

    import urllib.parse
    from app.core.config import settings

    # Use the client ID from environment variables
    client_id = settings.ZOHO_CLIENT_ID

    scopes = [
        "ZohoCRM.modules.ALL",
        "ZohoCRM.settings.ALL",
        "ZohoCRM.users.ALL",
        "ZohoCRM.org.ALL",
        "ZohoCRM.bulk.ALL"
    ]

    # Use production redirect URI for production, localhost for development
    if settings.ENVIRONMENT == "production":
        redirect_uri = "https://api.1chsalesreports.com/api/zoho/auth/callback"
    else:
        redirect_uri = "http://localhost:8000/api/zoho/auth/callback"

    params = {
        "scope": ",".join(scopes),
        "client_id": client_id,
        "response_type": "code",
        "access_type": "offline",
        "redirect_uri": redirect_uri
    }

    base_url = "https://accounts.zoho.in/oauth/v2/auth"
    auth_url = f"{base_url}?" + urllib.parse.urlencode(params)

    return {
        "auth_url": auth_url,
        "instructions": [
            "1. Visit the auth_url in your browser",
            "2. Log in to your Zoho account (India data center)",
            "3. Grant permissions for all requested scopes",
            "4. Copy the authorization code from the callback page",
            "5. Use the code with the /auth/exchange-code endpoint"
        ]
    }


@router.get("/auth/callback")
async def auth_callback(code: Optional[str] = None, error: Optional[str] = None):
    """
    OAuth callback endpoint - displays the authorization code for manual use
    """
    if error:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authorization Error</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 50px; }}
                .error {{ color: red; }}
            </style>
        </head>
        <body>
            <h2 class="error">❌ Authorization Error</h2>
            <p>Error: {error}</p>
            <p>Please try the authorization process again.</p>
        </body>
        </html>
        """
    elif code:
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Authorization Successful</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 50px; }}
                .success {{ color: green; }}
                .code {{ background: #f5f5f5; padding: 10px; border: 1px solid #ddd; word-break: break-all; }}
                .instructions {{ background: #e7f3ff; padding: 15px; border-left: 4px solid #2196F3; }}
            </style>
        </head>
        <body>
            <h2 class="success">✅ Authorization Successful!</h2>
            <p>Your authorization code is:</p>
            <div class="code">{code}</div>

            <div class="instructions">
                <h3>Next Steps:</h3>
                <ol>
                    <li>Copy the authorization code above</li>
                    <li>Go to <a href="/docs#/zoho/exchange_authorization_code_api_zoho_auth_exchange_code_post" target="_blank">API Docs - Exchange Code</a></li>
                    <li>Click "Try it out" and paste the code</li>
                    <li>Execute to get your refresh token</li>
                    <li>Update your .env file with the new refresh token</li>
                </ol>
            </div>
        </body>
        </html>
        """
    else:
        html_content = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>No Authorization Code</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 50px; }
                .warning { color: orange; }
            </style>
        </head>
        <body>
            <h2 class="warning">⚠️ No Authorization Code Received</h2>
            <p>Please start the authorization process again.</p>
        </body>
        </html>
        """

    return HTMLResponse(content=html_content)
