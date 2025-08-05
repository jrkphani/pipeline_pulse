# backend/app/core/zoho_db_store.py
from typing import Optional, List
import asyncio
from zohocrmsdk.src.com.zoho.api.authenticator.store.token_store import TokenStore
from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
from zohocrmsdk.src.com.zoho.crm.api.user_signature import UserSignature
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from ..models.zoho_oauth_token import ZohoOAuthToken
from ..core.database import get_db

logger = structlog.get_logger()


def _run_async_in_sync_context(coro):
    """Helper to run async operations in sync context for Zoho SDK compatibility."""
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            # If we're already in a running event loop, create a task
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, coro)
                return future.result()
        else:
            # If no event loop is running, use asyncio.run()
            return asyncio.run(coro)
    except Exception as e:
        logger.error("Error running async operation", error=str(e), exc_info=True)
        return None


class ZohoPostgresDBStore(TokenStore):
    """
    Custom TokenStore implementation for PostgreSQL using SQLAlchemy.
    This class is essential for a multi-user setup following Zoho SDK documentation.
    
    This store handles OAuth token persistence for multiple users, ensuring
    that each user's tokens are securely stored and retrieved independently.
    """

    def __init__(self):
        """Initialize the PostgreSQL token store."""
        pass

    def find_token(self, token: OAuthToken) -> Optional[OAuthToken]:
        """
        Find a token in the database based on the token's user signature.
        
        Args:
            token: OAuthToken instance with user signature
            
        Returns:
            OAuthToken instance if found, None otherwise
        """
        try:
            return _run_async_in_sync_context(self._find_token_async(token))
        except Exception as e:
            logger.error("Error finding token", error=str(e), exc_info=True)
            return None

    async def _find_token_async(self, token: OAuthToken) -> Optional[OAuthToken]:
        """Async implementation of find_token."""
        if token.get_user_signature() is None:
            logger.warning("Cannot find token without user signature")
            return None
        
        user_email = token.get_user_signature().get_name()
        logger.info("Finding token for user", user_email=user_email)
        
        async for db in get_db():
            try:
                result = await db.execute(
                    select(ZohoOAuthToken).where(ZohoOAuthToken.user_email == user_email)
                )
                token_record = result.scalar_one_or_none()

                if token_record:
                    logger.info("Token found for user", user_email=user_email)
                    # Re-construct the OAuthToken object from our database model
                    return self._create_oauth_token_from_record(token_record)
                
                logger.info("No token found for user", user_email=user_email)
                return None
            except Exception as e:
                logger.error("Database error finding token", user_email=user_email, error=str(e))
                return None
            finally:
                break

    def save_token(self, token: OAuthToken) -> None:
        """
        Save or update a token in the database.
        
        Args:
            token: OAuthToken instance to save
        """
        try:
            # Run async operation in sync context required by Zoho SDK
            _run_async_in_sync_context(self._save_token_async(token))
        except Exception as e:
            logger.error("Error saving token", error=str(e), exc_info=True)
            raise

    async def _save_token_async(self, token: OAuthToken) -> None:
        """Async implementation of save_token."""
        if token.get_user_signature() is None:
            logger.error("Cannot save token without user signature")
            raise ValueError("Token must have user signature")
        
        user_email = token.get_user_signature().get_name()
        logger.info("Saving token for user", user_email=user_email)
        
        # Log what token values we're receiving
        logger.info("Token values being saved", 
                   user_email=user_email,
                   has_access_token=bool(token.get_access_token()),
                   has_refresh_token=bool(token.get_refresh_token()), 
                   has_grant_token=bool(token.get_grant_token()),
                   access_token_length=len(token.get_access_token()) if token.get_access_token() else 0,
                   refresh_token_length=len(token.get_refresh_token()) if token.get_refresh_token() else 0,
                   grant_token_preview=token.get_grant_token()[:20] + "..." if token.get_grant_token() else None)
        
        async for db in get_db():
            try:
                # Check if a token for this user already exists
                result = await db.execute(
                    select(ZohoOAuthToken).where(ZohoOAuthToken.user_email == user_email)
                )
                existing_token = result.scalar_one_or_none()

                if existing_token:
                    # Update existing token
                    logger.info("Updating existing token for user", user_email=user_email)
                    existing_token.client_id = token.get_client_id()
                    existing_token.client_secret = token.get_client_secret()
                    existing_token.refresh_token = token.get_refresh_token()
                    existing_token.access_token = token.get_access_token()
                    existing_token.grant_token = token.get_grant_token()
                    existing_token.expiry_time = token.get_expires_in()
                    existing_token.redirect_url = token.get_redirect_url()
                    existing_token.api_domain = token.get_api_domain()
                else:
                    # Create new token record
                    logger.info("Creating new token for user", user_email=user_email)
                    new_token = ZohoOAuthToken(
                        user_email=user_email,
                        client_id=token.get_client_id(),
                        client_secret=token.get_client_secret(),
                        refresh_token=token.get_refresh_token(),
                        access_token=token.get_access_token(),
                        grant_token=token.get_grant_token(),
                        expiry_time=token.get_expires_in(),
                        redirect_url=token.get_redirect_url(),
                        api_domain=token.get_api_domain()
                    )
                    db.add(new_token)
                
                await db.commit()
                logger.info("Token saved successfully for user", user_email=user_email)
            except Exception as e:
                logger.error("Database error saving token", user_email=user_email, error=str(e))
                await db.rollback()
                raise
            finally:
                break

    def delete_token(self, id: str) -> None:
        """
        Delete a token from the database.
        
        Args:
            id: User email (used as unique identifier)
        """
        try:
            # Run async operation in sync context required by Zoho SDK
            _run_async_in_sync_context(self._delete_token_async(id))
        except Exception as e:
            logger.error("Error deleting token", token_id=id, error=str(e), exc_info=True)
            raise

    async def _delete_token_async(self, id: str) -> None:
        """Async implementation of delete_token."""
        logger.info("Deleting token for user", user_email=id)
        
        async for db in get_db():
            try:
                # 'id' in this context is the user_email
                stmt = delete(ZohoOAuthToken).where(ZohoOAuthToken.user_email == id)
                result = await db.execute(stmt)
                await db.commit()
                
                if result.rowcount > 0:
                    logger.info("Token deleted successfully", user_email=id)
                else:
                    logger.warning("No token found to delete", user_email=id)
            except Exception as e:
                logger.error("Database error deleting token", user_email=id, error=str(e))
                await db.rollback()
                raise
            finally:
                break

    def get_tokens(self) -> List[OAuthToken]:
        """
        Get all tokens from the database.
        
        Returns:
            List of OAuthToken instances
        """
        try:
            # Run async operation in sync context required by Zoho SDK
            return _run_async_in_sync_context(self._get_tokens_async())
        except Exception as e:
            logger.error("Error getting all tokens", error=str(e), exc_info=True)
            return []

    async def _get_tokens_async(self) -> List[OAuthToken]:
        """Async implementation of get_tokens."""
        logger.info("Getting all tokens from database")
        
        async for db in get_db():
            try:
                result = await db.execute(select(ZohoOAuthToken))
                token_records = result.scalars().all()
                
                tokens = []
                for record in token_records:
                    oauth_token = self._create_oauth_token_from_record(record)
                    if oauth_token:
                        tokens.append(oauth_token)
                
                logger.info("Retrieved tokens from database", count=len(tokens))
                return tokens
            except Exception as e:
                logger.error("Database error getting tokens", error=str(e))
                return []
            finally:
                break

    def delete_tokens(self) -> None:
        """Delete all tokens from the database."""
        try:
            # Run async operation in sync context required by Zoho SDK
            _run_async_in_sync_context(self._delete_tokens_async())
        except Exception as e:
            logger.error("Error deleting all tokens", error=str(e), exc_info=True)
            raise

    async def _delete_tokens_async(self) -> None:
        """Async implementation of delete_tokens."""
        logger.warning("Deleting all tokens from database")
        
        async for db in get_db():
            try:
                await db.execute(delete(ZohoOAuthToken))
                await db.commit()
                logger.info("All tokens deleted successfully")
            except Exception as e:
                logger.error("Database error deleting all tokens", error=str(e))
                await db.rollback()
                raise
            finally:
                break

    def find_token_by_id(self, id: str) -> Optional[OAuthToken]:
        """
        Find a token by ID (user email).
        
        Args:
            id: User email
            
        Returns:
            OAuthToken instance if found, None otherwise
        """
        try:
            # Run async operation in sync context required by Zoho SDK
            return _run_async_in_sync_context(self._find_token_by_id_async(id))
        except Exception as e:
            logger.error("Error finding token by ID", token_id=id, error=str(e), exc_info=True)
            return None

    async def _find_token_by_id_async(self, id: str) -> Optional[OAuthToken]:
        """Async implementation of find_token_by_id."""
        logger.info("Finding token by ID", token_id=id)
        
        async for db in get_db():
            try:
                result = await db.execute(
                    select(ZohoOAuthToken).where(ZohoOAuthToken.user_email == id)
                )
                token_record = result.scalar_one_or_none()

                if token_record:
                    logger.info("Token found by ID", token_id=id)
                    return self._create_oauth_token_from_record(token_record)
                
                logger.info("No token found by ID", token_id=id)
                return None
            except Exception as e:
                logger.error("Database error finding token by ID", token_id=id, error=str(e))
                return None
            finally:
                break

    def _create_oauth_token_from_record(self, record: ZohoOAuthToken) -> OAuthToken:
        """
        Create an OAuthToken instance from a database record.
        
        Args:
            record: ZohoOAuthToken database record
            
        Returns:
            OAuthToken instance
        """
        try:
            # Create user signature for the token
            user_signature = UserSignature(name=record.user_email)
            
            oauth_token = OAuthToken(
                client_id=record.client_id,
                client_secret=record.client_secret,
                refresh_token=record.refresh_token,
                access_token=record.access_token,
                grant_token=record.grant_token,
                redirect_url=record.redirect_url,
                id=record.user_email  # The SDK uses 'id' internally, we map it to our primary key
            )
            
            # Set user signature
            oauth_token.set_user_signature(user_signature)
            
            # Set expiry time if available
            if record.expiry_time:
                oauth_token.set_expires_in(record.expiry_time)
            
            # Set API domain if available
            if record.api_domain:
                oauth_token.set_api_domain(record.api_domain)
            
            return oauth_token
        except Exception as e:
            logger.error("Error creating OAuthToken from record", 
                        user_email=record.user_email, error=str(e))
            return None


# Create a single instance of our store to be used across the app
zoho_db_store = ZohoPostgresDBStore()