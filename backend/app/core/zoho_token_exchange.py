# backend/app/core/zoho_token_exchange.py
import httpx
import structlog
from typing import Dict, Optional
from .config import settings

logger = structlog.get_logger()


async def exchange_grant_token_for_refresh_token(grant_token: str) -> Optional[Dict[str, str]]:
    """
    Manually exchange a Zoho grant token for access and refresh tokens.
    
    This is a one-time operation that should be done during initial setup
    or when a user first authorizes the application.
    
    Args:
        grant_token: The authorization code received from Zoho OAuth callback
        
    Returns:
        Dict containing access_token, refresh_token, expires_in, etc.
        None if the exchange failed
    """
    try:
        logger.info("Manually exchanging grant token for refresh token", 
                   grant_token_preview=grant_token[:20] + "...")
        
        # Zoho token exchange endpoint based on configured region
        region_map = {
            'US': 'https://accounts.zoho.com/oauth/v2/token',
            'EU': 'https://accounts.zoho.eu/oauth/v2/token',
            'IN': 'https://accounts.zoho.in/oauth/v2/token',
            'AU': 'https://accounts.zoho.com.au/oauth/v2/token',
            'CN': 'https://accounts.zoho.com.cn/oauth/v2/token',
        }
        token_url = region_map.get(settings.zoho_region, 'https://accounts.zoho.in/oauth/v2/token')
        
        # Prepare token exchange request
        data = {
            "grant_type": "authorization_code",
            "client_id": settings.zoho_client_id,
            "client_secret": settings.zoho_client_secret,
            "redirect_uri": settings.zoho_redirect_uri,
            "code": grant_token
        }
        
        logger.info("Making token exchange request to Zoho", 
                   client_id=settings.zoho_client_id,
                   redirect_uri=settings.zoho_redirect_uri,
                   token_url=token_url,
                   region=settings.zoho_region)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                token_url,
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                timeout=30.0
            )
        
        logger.info("Token exchange response", 
                   status_code=response.status_code,
                   response_preview=str(response.text)[:200] + "...")
        
        if response.status_code == 200:
            token_data = response.json()
            
            # Validate that we received the required tokens
            if not token_data.get("access_token") or not token_data.get("refresh_token"):
                logger.error("Token exchange response missing required tokens",
                           has_access_token=bool(token_data.get("access_token")),
                           has_refresh_token=bool(token_data.get("refresh_token")),
                           response_keys=list(token_data.keys()))
                return None
            
            # Log what we received (without sensitive data)
            logger.info("Token exchange successful", 
                       has_access_token=bool(token_data.get("access_token")),
                       has_refresh_token=bool(token_data.get("refresh_token")),
                       expires_in=token_data.get("expires_in"),
                       token_type=token_data.get("token_type"),
                       scope=token_data.get("scope"))
            
            return token_data
        else:
            logger.error("Token exchange failed", 
                        status_code=response.status_code,
                        response_text=response.text)
            return None
            
    except Exception as e:
        logger.error("Error during token exchange", error=str(e), exc_info=True)
        return None


async def save_refresh_token_to_config(refresh_token: str) -> bool:
    """
    Save the refresh token to environment configuration.
    
    For production, this should be saved to a secure environment variable
    or secrets management system.
    
    Args:
        refresh_token: The refresh token to save
        
    Returns:
        bool: True if saved successfully
    """
    try:
        logger.info("Saving refresh token to configuration")
        
        # For development, we'll save to .env file
        env_file_path = "/Users/jrkphani/Projects/pipeline-pulse/backend/.env"
        
        # Read current .env file
        with open(env_file_path, 'r') as f:
            lines = f.readlines()
        
        # Update or add the refresh token line
        updated_lines = []
        refresh_token_updated = False
        
        for line in lines:
            if line.startswith('ZOHO_REFRESH_TOKEN='):
                updated_lines.append(f'ZOHO_REFRESH_TOKEN={refresh_token}\n')
                refresh_token_updated = True
            else:
                updated_lines.append(line)
        
        # If refresh token line wasn't found, add it
        if not refresh_token_updated:
            updated_lines.append(f'ZOHO_REFRESH_TOKEN={refresh_token}\n')
        
        # Write back to .env file
        with open(env_file_path, 'w') as f:
            f.writelines(updated_lines)
        
        logger.info("Refresh token saved to .env file successfully")
        return True
        
    except Exception as e:
        logger.error("Failed to save refresh token to config", error=str(e), exc_info=True)
        return False


async def initialize_zoho_with_refresh_token(refresh_token: str) -> bool:
    """
    Initialize the Zoho SDK using a refresh token (instead of grant token).
    
    This is the clean, reliable way to initialize the SDK after we've
    obtained a refresh token through manual exchange.
    
    Args:
        refresh_token: The refresh token to use for initialization
        
    Returns:
        bool: True if initialization successful
    """
    try:
        from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
        from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
        from zohocrmsdk.src.com.zoho.crm.api.user_signature import UserSignature
        from zohocrmsdk.src.com.zoho.crm.api.sdk_config import SDKConfig
        from zohocrmsdk.src.com.zoho.api.logger import Logger as ZohoLogger
        from .zoho_sdk import get_zoho_data_center
        from .zoho_db_store import zoho_db_store
        
        logger.info("Initializing Zoho SDK with refresh token")
        
        # Create token with refresh token - don't set ID to avoid store lookup
        token = OAuthToken(
            client_id=settings.zoho_client_id,
            client_secret=settings.zoho_client_secret,
            refresh_token=refresh_token,
            redirect_url=settings.zoho_redirect_uri
        )
        
        # Set user signature
        user_signature = UserSignature(name=settings.zoho_api_user_email)
        token.set_user_signature(user_signature)
        
        # Configure SDK
        sdk_config = SDKConfig(
            auto_refresh_fields=True,
            pick_list_validation=True,
            connect_timeout=30.0,
            read_timeout=60.0
        )
        
        # Configure logger
        zoho_logger = ZohoLogger.get_instance(
            level=ZohoLogger.Levels.ERROR,
            file_path=f"/tmp/zoho_sdk_{settings.app_env}.log"
        )
        
        # Get environment
        environment = get_zoho_data_center()
        
        # Initialize SDK without store initially to avoid merge issues
        # We'll use the refresh token directly
        Initializer.initialize(
            environment=environment,
            token=token,
            sdk_config=sdk_config,
            logger=zoho_logger
        )
        
        logger.info("Zoho SDK initialized successfully with refresh token")
        return True
        
    except Exception as e:
        logger.error("Failed to initialize Zoho SDK with refresh token", 
                    error=str(e), exc_info=True)
        return False