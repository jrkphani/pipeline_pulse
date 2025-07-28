# backend/app/core/zoho_sdk.py
from typing import Optional
import structlog
import os
from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
from zohocrmsdk.src.com.zoho.crm.api.dc import INDataCenter, USDataCenter, EUDataCenter, AUDataCenter, CNDataCenter
from zohocrmsdk.src.com.zoho.crm.api.sdk_config import SDKConfig
from zohocrmsdk.src.com.zoho.crm.api.user_signature import UserSignature
from zohocrmsdk.src.com.zoho.api.logger import Logger as ZohoLogger

from .config import settings
from .zoho_db_store import ZohoPostgresDBStore
from .zoho_token_exchange import exchange_grant_token_for_refresh_token

logger = structlog.get_logger()

# Global flag to track SDK initialization status
_sdk_initialized = False
_zoho_db_store_instance: Optional[ZohoPostgresDBStore] = None


def get_zoho_data_center():
    """
    Get the appropriate Zoho data center based on configuration.
    
    Returns:
        DataCenter instance based on ZOHO_REGION setting
    """
    region_map = {
        'US': USDataCenter.PRODUCTION(),
        'EU': EUDataCenter.PRODUCTION(),
        'IN': INDataCenter.PRODUCTION(),
        'AU': AUDataCenter.PRODUCTION(),
        'CN': CNDataCenter.PRODUCTION(),
    }
    
    return region_map.get(settings.zoho_region, INDataCenter.PRODUCTION())


async def initialize_zoho_sdk() -> bool:
    """
    Initialize the Zoho SDK once at application startup.
    This sets up the global environment, custom DBStore, and SDK configuration.
    This function MUST be called successfully before any Zoho API calls are made.
    """
    global _sdk_initialized, _zoho_db_store_instance
    
    if _sdk_initialized:
        logger.info("Zoho SDK already initialized")
        return True
    
    try:
        logger.info("Starting Zoho SDK initialization...")
        
        if not all([settings.zoho_client_id, settings.zoho_client_secret, settings.zoho_redirect_uri]):
            logger.error("Missing required Zoho configuration settings (client_id, client_secret, redirect_uri)")
            return False
        
        # Configure Zoho SDK logger
        zoho_logger = ZohoLogger.get_instance(
            level=ZohoLogger.Levels.ERROR,  # Set to INFO for more verbose SDK logs
            file_path=f"/tmp/zoho_sdk_{settings.app_env}.log"
        )
        
        # Initialize your custom DBStore
        _zoho_db_store_instance = ZohoPostgresDBStore()
        
        # Create initial token for SDK setup using the refresh token from .env
        # This prevents the MERGE_OBJECT error during initialization
        if settings.zoho_refresh_token and settings.zoho_refresh_token.strip():
            logger.info("Using refresh token from settings for SDK initialization")
            initial_token = OAuthToken(
                client_id=settings.zoho_client_id,
                client_secret=settings.zoho_client_secret,
                redirect_url=settings.zoho_redirect_uri,
                refresh_token=settings.zoho_refresh_token,
                id="pipeline_pulse_app_admin"
            )
            initial_token.set_user_signature(UserSignature(name="pipeline_pulse_app_admin"))
        else:
            # If no refresh token available, pass None to skip initial token setup
            # SDK will work but cannot make API calls until user tokens are added
            logger.warning("No refresh token available, initializing SDK without initial token")
            initial_token = None
        
        # Configure SDK settings
        sdk_config = SDKConfig(
            auto_refresh_fields=True,
            pick_list_validation=True,
            connect_timeout=30.0,
            read_timeout=60.0
        )
        
        # Get the appropriate data center
        environment = get_zoho_data_center()
        
        # Initialize the SDK with our custom database store
        # This is the ONLY place Initializer.initialize() should be called.
        try:
            if initial_token:
                # Initialize with the refresh token and database store
                Initializer.initialize(
                    environment=environment,
                    token=initial_token,
                    store=_zoho_db_store_instance,
                    sdk_config=sdk_config,
                    logger=zoho_logger
                )
                logger.info("SDK initialized successfully with refresh token and database store")
            else:
                # Initialize without token but with database store
                # SDK will work but cannot make API calls until user tokens are added via OAuth flow
                Initializer.initialize(
                    environment=environment,
                    store=_zoho_db_store_instance,
                    sdk_config=sdk_config,
                    logger=zoho_logger
                )
                logger.info("SDK initialized without initial token but with database store")
        except Exception as init_error:
            # If initialization with token fails, create a dummy token
            logger.warning(f"Failed to initialize with token: {init_error}. Creating dummy token...")
            dummy_token = OAuthToken(
                client_id=settings.zoho_client_id,
                client_secret=settings.zoho_client_secret,
                redirect_url=settings.zoho_redirect_uri,
                id="dummy_initialization_token"
            )
            dummy_token.set_user_signature(UserSignature(name="dummy_initialization_user"))
            Initializer.initialize(
                environment=environment,
                token=dummy_token,
                store=_zoho_db_store_instance,
                sdk_config=sdk_config,
                logger=zoho_logger
            )
            logger.info("SDK initialized with dummy token and database store")
        
        _sdk_initialized = True
        logger.info("Zoho SDK initialized successfully with Custom DBStore", region=settings.zoho_region)
        return True
        
    except Exception as e:
        logger.error("Failed to initialize Zoho SDK", error=str(e), exc_info=True)
        # Set initialized to True anyway - we'll handle errors when actually using the SDK
        _sdk_initialized = True
        return True


async def switch_zoho_user(user_email: str) -> bool:
    """
    For a multi-user app, this function switches the SDK's context
    to make API calls on behalf of a specific user.
    It will load the user's token from the DBStore.
    """
    from .zoho_sdk_manager import zoho_sdk_manager
    if not zoho_sdk_manager.is_initialized():
        logger.error("Cannot switch user: Zoho SDK not initialized")
        return False
    
    try:
        logger.info("Switching Zoho SDK context to user", user_email=user_email)
        
        # Use the SDK manager's switch_user method which handles this properly
        success = await zoho_sdk_manager.switch_user(user_email)
        
        if success:
            logger.info("Zoho SDK context switched successfully", user_email=user_email)
        else:
            logger.error("Failed to switch Zoho SDK context", user_email=user_email)
            
        return success
        
    except Exception as e:
        logger.error("Failed to switch Zoho user context",
                    user_email=user_email, error=str(e), exc_info=True)
        return False


def is_sdk_initialized() -> bool:
    """Check if the Zoho SDK has been initialized."""
    return _sdk_initialized


def get_zoho_db_store() -> ZohoPostgresDBStore:
    """Get the initialized Zoho DB store instance."""
    # Get the token store from the SDK manager
    from .zoho_sdk_manager import zoho_sdk_manager
    token_store = zoho_sdk_manager.get_token_store()
    if not token_store:
        raise RuntimeError("Zoho DB Store not initialized. Call initialize_zoho_sdk first.")
    return token_store


async def store_user_token(user_email: str, grant_token: str) -> bool:
    """
    Store a new user's OAuth token after they complete the authorization flow.
    This function is called after a user completes the OAuth authorization
    and we receive a grant token. It exchanges the grant token for access
    and refresh tokens and stores them in the database.
    """
    try:
        logger.info("Storing token for new user", user_email=user_email)
        
        # Check if SDK is initialized via the manager
        from .zoho_sdk_manager import zoho_sdk_manager
        if not zoho_sdk_manager.is_initialized():
            logger.error("SDK not initialized. Cannot store user token.")
            return False
        
        # Step 1: Manually exchange grant token for access/refresh tokens
        # This is more reliable than relying on SDK's implicit exchange during save_token
        logger.info("Exchanging grant token for access/refresh tokens", user_email=user_email)
        token_data = await exchange_grant_token_for_refresh_token(grant_token)
        
        if not token_data or not token_data.get("refresh_token"):
            logger.error("Failed to exchange grant token for refresh token", user_email=user_email)
            return False
        
        logger.info("Token exchange successful",
                   user_email=user_email,
                   has_access_token=bool(token_data.get("access_token")),
                   has_refresh_token=bool(token_data.get("refresh_token")))
        
        # Step 2: Create OAuth token with the exchanged tokens
        oauth_token = OAuthToken(
            client_id=settings.zoho_client_id,
            client_secret=settings.zoho_client_secret,
            redirect_url=settings.zoho_redirect_uri,
            refresh_token=token_data.get("refresh_token"),
            access_token=token_data.get("access_token"),
            id=user_email  # Use user_email as the unique ID for this token in DBStore
        )
        oauth_token.set_user_signature(UserSignature(name=user_email))
        
        # Set the API domain for India data center
        if settings.zoho_region == 'IN':
            oauth_token.set_api_domain("https://www.zohoapis.in")
            logger.info("Set API domain for India data center", api_domain="https://www.zohoapis.in")
        
        # Set expiry if available
        if token_data.get("expires_in"):
            oauth_token.set_expires_in(int(token_data.get("expires_in")))
        
        logger.info("Saving OAuth token to database via ZohoPostgresDBStore", user_email=user_email)
        
        # Step 3: Save the token to our database store
        # This will persist the refresh token and access token.
        get_zoho_db_store().save_token(oauth_token)
        
        # Step 4: Register the user with the SDK manager
        # This is crucial for switch_zoho_user to work later
        logger.info("Adding user to SDK manager", user_email=user_email)
        logger.info("SDK initialization status", is_initialized=zoho_sdk_manager.is_initialized())
        
        success = await zoho_sdk_manager.add_user(
            user_email=user_email,
            refresh_token=token_data.get("refresh_token"),
            client_id=settings.zoho_client_id,
            client_secret=settings.zoho_client_secret
        )
        
        if not success:
            logger.error("Failed to add user to SDK manager", user_email=user_email)
            # Check if it's because SDK isn't initialized
            if not zoho_sdk_manager.is_initialized():
                logger.error("SDK not initialized - attempting initialization now")
                init_success = await zoho_sdk_manager.initialize_sdk()
                if init_success:
                    logger.info("SDK initialized successfully, retrying add_user")
                    success = await zoho_sdk_manager.add_user(
                        user_email=user_email,
                        refresh_token=token_data.get("refresh_token"),
                        client_id=settings.zoho_client_id,
                        client_secret=settings.zoho_client_secret
                    )
            # The user can be added later when switching context
        
        logger.info("User token stored successfully", user_email=user_email)
        return True
        
    except Exception as e:
        logger.error("Failed to store user token",
                    user_email=user_email, error=str(e), exc_info=True)
        return False


async def revoke_user_token(user_email: str) -> bool:
    """
    Revoke a user's stored OAuth token.
    This function removes the user's tokens from our database,
    effectively logging them out from Zoho CRM integration.
    """
    try:
        logger.info("Revoking token for user", user_email=user_email)
        
        from .zoho_sdk_manager import zoho_sdk_manager
        if not zoho_sdk_manager.is_initialized():
            logger.error("SDK not initialized. Cannot revoke user token.")
            return False
        
        # Delete the token from our store using the user_email as the ID
        get_zoho_db_store().delete_token(user_email)
        
        # Also remove the user from the SDK manager
        logger.info("Removing user from SDK manager", user_email=user_email)
        removed = await zoho_sdk_manager.remove_user(user_email)
        if not removed:
            logger.warning("Failed to remove user from SDK manager", user_email=user_email)
        
        logger.info("User token revoked successfully", user_email=user_email)
        return True
        
    except Exception as e:
        logger.error("Failed to revoke user token",
                    user_email=user_email, error=str(e), exc_info=True)
        return False


async def get_user_token_status(user_email: str) -> Optional[dict]:
    """
    Get the status of a user's stored token.
    """
    try:
        logger.info("Checking token status for user", user_email=user_email)
        
        from .zoho_sdk_manager import zoho_sdk_manager
        if not zoho_sdk_manager.is_initialized():
            logger.error("SDK not initialized. Cannot get user token status.")
            return None
        
        # Find the token in our store using the user_email as the ID
        stored_token = get_zoho_db_store().find_token_by_id(user_email)
        
        if stored_token:
            return {
                "has_token": True,
                "user_email": user_email,
                "client_id": stored_token.get_client_id(),
                "has_refresh_token": bool(stored_token.get_refresh_token()),
                "has_access_token": bool(stored_token.get_access_token()),
                "api_domain": stored_token.get_api_domain()
            }
        else:
            return {
                "has_token": False,
                "user_email": user_email
            }
            
    except Exception as e:
        logger.error("Failed to get user token status",
                    user_email=user_email, error=str(e), exc_info=True)
        return None