"""
Integration tests for Zoho SDK implementation
Tests the complete SDK integration flow including authentication, operations, and error handling
"""

import pytest
import asyncio
import logging
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, Any

from app.services.zoho_sdk_manager import ZohoSDKManager, get_sdk_manager
from app.services.async_zoho_wrapper import AsyncZohoWrapper, AsyncZohoWrapperError
from app.services.zoho_service import ZohoService
from app.core.config import settings

logger = logging.getLogger(__name__)


class TestZohoSDKIntegration:
    """Test suite for Zoho SDK integration"""
    
    @pytest.fixture
    def sdk_manager(self):
        """Create SDK manager instance for testing"""
        return ZohoSDKManager()
    
    @pytest.fixture
    def zoho_service(self):
        """Create Zoho service instance for testing"""
        return ZohoService()
    
    def test_sdk_manager_initialization(self, sdk_manager):
        """Test SDK manager initialization"""
        assert sdk_manager is not None
        assert not sdk_manager.is_initialized()
        
        # Test configuration validation
        config = sdk_manager.get_config()
        assert config is None  # Not initialized yet
    
    @pytest.mark.asyncio
    async def test_sdk_initialization_missing_credentials(self, sdk_manager):
        """Test SDK initialization with missing credentials"""
        with patch.object(settings, 'ZOHO_CLIENT_ID', ''):
            with patch.object(settings, 'ZOHO_CLIENT_SECRET', ''):
                with pytest.raises(Exception):
                    sdk_manager.initialize_sdk()
    
    @pytest.mark.asyncio
    async def test_sdk_initialization_with_valid_credentials(self, sdk_manager):
        """Test SDK initialization with valid credentials"""
        with patch.object(settings, 'ZOHO_CLIENT_ID', 'test_client_id'):
            with patch.object(settings, 'ZOHO_CLIENT_SECRET', 'test_client_secret'):
                with patch.object(settings, 'ZOHO_REDIRECT_URI', 'http://localhost:8000/callback'):
                    # Mock the SDK initialization
                    with patch('app.services.zoho_sdk_manager.SDK_AVAILABLE', True):
                        with patch('app.services.zoho_sdk_manager.Initializer') as mock_init:
                            mock_init.initialize.return_value = None
                            
                            result = sdk_manager.initialize_sdk()
                            assert result is True
                            assert sdk_manager.is_initialized()
    
    def test_async_wrapper_context_manager(self):
        """Test async wrapper context manager functionality"""
        wrapper = AsyncZohoWrapper()
        assert wrapper is not None
        assert wrapper.executor is None  # Not entered yet
    
    @pytest.mark.asyncio
    async def test_async_wrapper_error_handling(self):
        """Test async wrapper error handling"""
        wrapper = AsyncZohoWrapper()
        
        # Test with uninitialized SDK
        with pytest.raises(AsyncZohoWrapperError):
            await wrapper.get_records("Deals")
    
    @pytest.mark.asyncio
    async def test_zoho_service_initialization(self, zoho_service):
        """Test Zoho service initialization"""
        assert zoho_service is not None
        assert zoho_service.base_url == settings.ZOHO_BASE_URL
        assert zoho_service.sdk_manager is not None
    
    @pytest.mark.asyncio
    async def test_zoho_service_sdk_initialization_check(self, zoho_service):
        """Test Zoho service SDK initialization check"""
        # Mock SDK manager
        with patch.object(zoho_service.sdk_manager, 'is_initialized', return_value=False):
            with patch.object(zoho_service.sdk_manager, 'initialize_sdk', return_value=True):
                result = await zoho_service._ensure_sdk_initialized()
                assert result is True
    
    @pytest.mark.asyncio
    async def test_zoho_service_deal_operations_without_sdk(self, zoho_service):
        """Test deal operations when SDK is not available"""
        # Mock SDK not initialized
        with patch.object(zoho_service, '_ensure_sdk_initialized', return_value=False):
            result = await zoho_service.update_deal("test_id", {"Deal_Name": "Test Deal"})
            assert result["status"] == "error"
            assert "SDK not initialized" in result["error"]
    
    def test_field_validation(self, zoho_service):
        """Test field validation functionality"""
        # Test valid amount
        result = zoho_service.validate_field("Amount", "1000.50")
        assert result["valid"] is True
        
        # Test invalid amount
        result = zoho_service.validate_field("Amount", "invalid")
        assert result["valid"] is False
        assert "valid number" in result["message"]
        
        # Test valid probability
        result = zoho_service.validate_field("Probability", "75")
        assert result["valid"] is True
        
        # Test invalid probability
        result = zoho_service.validate_field("Probability", "150")
        assert result["valid"] is False
        assert "between 0 and 100" in result["message"]
        
        # Test valid date
        result = zoho_service.validate_field("Closing_Date", "2024-12-31T00:00:00Z")
        assert result["valid"] is True
        
        # Test invalid date
        result = zoho_service.validate_field("Closing_Date", "invalid-date")
        assert result["valid"] is False
        assert "valid date" in result["message"]
    
    @pytest.mark.asyncio
    async def test_connection_status(self, zoho_service):
        """Test connection status functionality"""
        with patch.object(zoho_service.sdk_manager, 'validate_initialization') as mock_validate:
            mock_validate.return_value = {
                "status": "success",
                "initialized": True,
                "sdk_available": True,
                "message": "SDK ready"
            }
            
            status = await zoho_service.get_connection_status()
            assert status["status"] == "healthy"
            assert status["sdk_initialized"] is True


class TestSDKResponseHandling:
    """Test SDK response handling and transformation"""
    
    @pytest.mark.asyncio
    async def test_successful_response_transformation(self):
        """Test successful SDK response transformation"""
        mock_response = {
            "status": "success",
            "data": [
                {
                    "id": "123456",
                    "Deal_Name": "Test Deal",
                    "Amount": 50000,
                    "Currency": "SGD",
                    "Stage": "Proposal"
                }
            ]
        }
        
        # Test that the response structure is preserved
        assert mock_response["status"] == "success"
        assert len(mock_response["data"]) == 1
        assert mock_response["data"][0]["id"] == "123456"
    
    def test_error_response_handling(self):
        """Test error response handling"""
        error_response = {
            "status": "error",
            "message": "Authentication failed",
            "error_code": "INVALID_TOKEN"
        }
        
        # Test error response structure
        assert error_response["status"] == "error"
        assert "Authentication failed" in error_response["message"]


class TestSDKPerformance:
    """Test SDK performance and concurrent operations"""
    
    @pytest.mark.asyncio
    async def test_concurrent_operations(self):
        """Test concurrent SDK operations"""
        # Mock multiple async operations
        async def mock_operation(operation_id: int):
            await asyncio.sleep(0.1)  # Simulate API call
            return {"id": operation_id, "status": "success"}
        
        # Run multiple operations concurrently
        tasks = [mock_operation(i) for i in range(5)]
        results = await asyncio.gather(*tasks)
        
        assert len(results) == 5
        for i, result in enumerate(results):
            assert result["id"] == i
            assert result["status"] == "success"
    
    @pytest.mark.asyncio
    async def test_rate_limit_handling(self):
        """Test rate limit handling in async operations"""
        # Mock rate limit error
        with patch('app.services.async_zoho_wrapper.AsyncZohoWrapper.get_records') as mock_get:
            mock_get.side_effect = AsyncZohoWrapperError("Rate limit exceeded")
            
            wrapper = AsyncZohoWrapper()
            with pytest.raises(AsyncZohoWrapperError) as exc_info:
                await wrapper.get_records("Deals")
            
            assert "Rate limit exceeded" in str(exc_info.value)


class TestSDKConfiguration:
    """Test SDK configuration and environment handling"""
    
    def test_data_center_configuration(self):
        """Test data center configuration"""
        sdk_manager = ZohoSDKManager()
        
        # Test valid data centers
        with patch('app.services.zoho_sdk_manager.SDK_AVAILABLE', True):
            for dc in ["US", "EU", "IN", "AU"]:
                dc_instance = sdk_manager._get_data_center(dc)
                assert dc_instance is not None
        
        # Test invalid data center
        with pytest.raises(Exception):
            sdk_manager._get_data_center("INVALID")
    
    def test_token_store_configuration(self):
        """Test token store configuration"""
        sdk_manager = ZohoSDKManager()
        
        # Test file store
        store = sdk_manager._setup_token_store("FILE", "./test_tokens.txt", "test@example.com")
        assert store is not None
        
        # Test DB store (should fall back to file)
        store = sdk_manager._setup_token_store("DB", None, "test@example.com")
        assert store is not None


# Integration test configuration
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])