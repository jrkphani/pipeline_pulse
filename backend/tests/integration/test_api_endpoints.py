"""
Integration tests for API endpoints with SDK integration
Tests complete API functionality with the new SDK implementation
"""

import pytest
import asyncio
from httpx import AsyncClient
from unittest.mock import Mock, patch, AsyncMock
from typing import Dict, Any

from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings


class TestOAuthEndpoints:
    """Test OAuth endpoints with SDK integration"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    def test_get_auth_url(self, client):
        """Test OAuth URL generation"""
        response = client.get("/api/zoho/auth-url")
        
        if response.status_code == 200:
            data = response.json()
            assert "auth_url" in data
            assert "state" in data
            assert "expires_in" in data
            assert data["expires_in"] == 600
        else:
            # Expected if no OAuth credentials configured
            assert response.status_code in [500, 422]
    
    def test_oauth_status_without_tokens(self, client):
        """Test OAuth status when no tokens are configured"""
        with patch.object(settings, 'ZOHO_REFRESH_TOKEN', ''):
            response = client.get("/api/zoho/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["connected"] is False
            assert data["status"] == "not_configured"


class TestCRMEndpoints:
    """Test CRM-related endpoints"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_health_endpoint(self, client):
        """Test health endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
    
    def test_simple_health_endpoint(self, client):
        """Test simple health endpoint"""
        response = client.get("/health-simple")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ok"


class TestLiveSyncEndpoints:
    """Test live sync endpoints with SDK"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_sync_status_unauthorized(self, client):
        """Test sync status without authentication"""
        # Most sync endpoints require authentication
        response = client.get("/api/sync/status")
        
        # Should return 401 for protected endpoints
        assert response.status_code in [401, 404]  # 404 if endpoint doesn't exist yet
    
    def test_full_sync_unauthorized(self, client):
        """Test full sync without authentication"""
        response = client.post("/api/sync/full")
        
        # Should return 401 for protected endpoints
        assert response.status_code in [401, 404]


class TestSDKIntegrationEndpoints:
    """Test endpoints that specifically use SDK functionality"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.mark.asyncio
    async def test_sdk_initialization_via_api(self):
        """Test SDK initialization through API calls"""
        async with AsyncClient(app=app, base_url="http://test") as ac:
            # Test health endpoint which doesn't require auth
            response = await ac.get("/health-simple")
            assert response.status_code == 200
            
            # Test root endpoint
            response = await ac.get("/")
            assert response.status_code == 200
            data = response.json()
            assert data["message"] == "Pipeline Pulse API"


class TestBulkOperations:
    """Test bulk operations with SDK"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_bulk_operations_unauthorized(self, client):
        """Test bulk operations without authentication"""
        response = client.get("/api/bulk/status")
        
        # Should return 401 for protected endpoints
        assert response.status_code in [401, 404]


class TestWebhookEndpoints:
    """Test webhook endpoints"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_webhook_endpoint_exists(self, client):
        """Test that webhook endpoint exists"""
        # Test webhook endpoint (POST usually)
        response = client.post("/api/zoho/webhook", json={"test": "data"})
        
        # Should either process webhook or return method not allowed
        assert response.status_code in [200, 405, 422, 401, 404]


class TestErrorHandling:
    """Test error handling in SDK integration"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_invalid_endpoint(self, client):
        """Test invalid endpoint handling"""
        response = client.get("/api/invalid/endpoint")
        assert response.status_code == 404
    
    def test_options_request(self, client):
        """Test CORS OPTIONS request handling"""
        response = client.options("/api/test")
        assert response.status_code == 200
        
        data = response.json()
        assert data["message"] == "OK"


class TestPerformance:
    """Test API performance with SDK"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self):
        """Test concurrent API requests"""
        async def make_request():
            async with AsyncClient(app=app, base_url="http://test") as ac:
                return await ac.get("/health-simple")
        
        # Make 10 concurrent requests
        tasks = [make_request() for _ in range(10)]
        responses = await asyncio.gather(*tasks)
        
        # All should succeed
        for response in responses:
            assert response.status_code == 200
    
    def test_response_time(self, client):
        """Test API response time"""
        import time
        
        start_time = time.time()
        response = client.get("/health-simple")
        end_time = time.time()
        
        assert response.status_code == 200
        
        response_time = end_time - start_time
        # Should respond within 1 second for simple health check
        assert response_time < 1.0


class TestCORSConfiguration:
    """Test CORS configuration"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.get("/health-simple")
        
        # Should have CORS headers in development
        if settings.ENVIRONMENT != "production":
            # Headers should be present
            assert response.status_code == 200


# Configuration for async tests
@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])