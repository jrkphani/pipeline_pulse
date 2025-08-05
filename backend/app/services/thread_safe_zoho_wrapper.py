"""
Thread-Safe Zoho SDK Wrapper
Implements proper multi-threading using Initializer.switch_user() pattern
"""

import threading
import logging
from typing import Dict, Any, Optional, Callable
from contextlib import contextmanager

from zohocrmsdk.src.com.zoho.crm.api.initializer import Initializer
from zohocrmsdk.src.com.zoho.api.authenticator.oauth_token import OAuthToken
from zohocrmsdk.src.com.zoho.crm.api.user_signature import UserSignature
from zohocrmsdk.src.com.zoho.crm.api.record import RecordOperations
from zohocrmsdk.src.com.zoho.crm.api.exception import SDKException

from .improved_zoho_sdk_manager import get_improved_sdk_manager
from ..core.config import settings

logger = logging.getLogger(__name__)


class ThreadSafeZohoWrapper:
    """
    Thread-safe wrapper for Zoho SDK operations
    Ensures proper user context switching in multi-threaded environments
    """
    
    def __init__(self):
        """Initialize thread-safe wrapper"""
        self._sdk_manager = get_improved_sdk_manager()
        self._thread_local = threading.local()
        self._user_lock = threading.RLock()
        self._initialized = False
    
    def initialize(self, **kwargs) -> bool:
        """
        Initialize SDK (thread-safe)
        
        Returns:
            bool: True if initialization successful
        """
        with self._user_lock:
            if self._initialized:
                return True
            
            # Initialize through improved manager
            import asyncio
            loop = asyncio.new_event_loop()
            try:
                result = loop.run_until_complete(
                    self._sdk_manager.initialize(**kwargs)
                )
                if result:
                    self._initialized = True
                return result
            finally:
                loop.close()
    
    @contextmanager
    def user_context(self, user_email: str):
        """
        Context manager for user-specific operations
        Ensures proper user switching and cleanup
        
        Args:
            user_email: Email of the user for context
            
        Example:
            with wrapper.user_context("user@example.com"):
                # All operations here will be performed as user@example.com
                records = wrapper.get_records("Leads")
        """
        # Store original user if any
        original_user = getattr(self._thread_local, 'current_user', None)
        
        try:
            # Switch to requested user
            self._switch_user(user_email)
            self._thread_local.current_user = user_email
            yield
            
        finally:
            # Restore original user
            if original_user and original_user != user_email:
                self._switch_user(original_user)
            self._thread_local.current_user = original_user
    
    def _switch_user(self, user_email: str):
        """
        Internal method to switch user context
        
        Args:
            user_email: Email of the user to switch to
        """
        with self._user_lock:
            try:
                # Get or create user token
                user_token = OAuthToken(id=user_email)
                user_token.set_user_signature(UserSignature(name=user_email))
                
                # Switch SDK context
                Initializer.switch_user(user_token)
                logger.debug(f"Thread {threading.current_thread().name} switched to user: {user_email}")
                
            except SDKException as e:
                logger.error(f"SDK error switching user: {e}")
                raise
            except Exception as e:
                logger.error(f"Error switching user: {e}")
                raise
    
    def get_current_user(self) -> Optional[str]:
        """
        Get current user for this thread
        
        Returns:
            Current user email or None
        """
        return getattr(self._thread_local, 'current_user', None)
    
    def execute_as_user(self, user_email: str, func: Callable, *args, **kwargs) -> Any:
        """
        Execute a function as a specific user
        
        Args:
            user_email: Email of the user
            func: Function to execute
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func
            
        Returns:
            Result of the function
        """
        with self.user_context(user_email):
            return func(*args, **kwargs)
    
    def get_records(
        self,
        module_name: str,
        user_email: str = None,
        **params
    ) -> Dict[str, Any]:
        """
        Get records for a specific user (thread-safe)
        
        Args:
            module_name: CRM module name
            user_email: User to execute as (uses current thread user if None)
            **params: Additional parameters
            
        Returns:
            Records data
        """
        user = user_email or self.get_current_user()
        if not user:
            raise ValueError("No user context set for thread")
        
        def _get_records():
            record_ops = RecordOperations(module_name)
            # Implementation would call SDK methods
            # This is a simplified example
            return {"records": [], "info": {"count": 0}}
        
        return self.execute_as_user(user, _get_records)
    
    def bulk_operation(
        self,
        user_operations: Dict[str, Callable]
    ) -> Dict[str, Any]:
        """
        Execute operations for multiple users in parallel
        
        Args:
            user_operations: Dict mapping user email to operation function
            
        Returns:
            Dict mapping user email to operation result
        """
        results = {}
        threads = []
        
        def _execute_for_user(user_email, operation):
            try:
                with self.user_context(user_email):
                    results[user_email] = operation()
            except Exception as e:
                results[user_email] = {"error": str(e)}
        
        # Create thread for each user operation
        for user_email, operation in user_operations.items():
            thread = threading.Thread(
                target=_execute_for_user,
                args=(user_email, operation),
                name=f"zoho-{user_email}"
            )
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        return results
    
    @property
    def is_initialized(self) -> bool:
        """Check if wrapper is initialized"""
        return self._initialized
    
    def add_user(self, user_email: str, refresh_token: str = None) -> bool:
        """
        Add a user to the SDK (thread-safe)
        
        Args:
            user_email: Email of the user
            refresh_token: Optional refresh token
            
        Returns:
            bool: True if successful
        """
        with self._user_lock:
            import asyncio
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(
                    self._sdk_manager.add_user(user_email, refresh_token)
                )
            finally:
                loop.close()
    
    def remove_user(self, user_email: str) -> bool:
        """
        Remove a user from the SDK (thread-safe)
        
        Args:
            user_email: Email of the user
            
        Returns:
            bool: True if successful
        """
        with self._user_lock:
            import asyncio
            loop = asyncio.new_event_loop()
            try:
                return loop.run_until_complete(
                    self._sdk_manager.remove_user(user_email)
                )
            finally:
                loop.close()


# Singleton instance
_thread_safe_wrapper = None
_wrapper_lock = threading.Lock()


def get_thread_safe_wrapper() -> ThreadSafeZohoWrapper:
    """
    Get singleton instance of ThreadSafeZohoWrapper
    
    Returns:
        ThreadSafeZohoWrapper instance
    """
    global _thread_safe_wrapper
    
    if _thread_safe_wrapper is None:
        with _wrapper_lock:
            if _thread_safe_wrapper is None:
                _thread_safe_wrapper = ThreadSafeZohoWrapper()
    
    return _thread_safe_wrapper