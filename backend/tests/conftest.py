"""
Pytest configuration for Pipeline Pulse tests
"""

import pytest
import asyncio
import os
import sys
from unittest.mock import Mock, patch

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.core.config import settings


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
def setup_test_environment():
    """Setup test environment variables"""
    with patch.dict(os.environ, {
        'ENVIRONMENT': 'test',
        'DATABASE_URL': 'sqlite:///./test_pipeline_pulse.db',
        'ZOHO_CLIENT_ID': 'test_client_id',
        'ZOHO_CLIENT_SECRET': 'test_client_secret',
        'ZOHO_REFRESH_TOKEN': 'test_refresh_token',
        'SECRET_KEY': 'test_secret_key_for_testing_only'
    }):
        yield


@pytest.fixture
def mock_sdk_available():
    """Mock SDK availability"""
    with patch('app.services.zoho_sdk_manager.SDK_AVAILABLE', True):
        yield


@pytest.fixture
def mock_sdk_manager():
    """Mock SDK manager for testing"""
    manager = Mock()
    manager.is_initialized.return_value = False
    manager.initialize_sdk.return_value = True
    manager.validate_initialization.return_value = {
        "status": "success",
        "initialized": True,
        "sdk_available": True,
        "message": "SDK ready"
    }
    return manager


@pytest.fixture
def mock_async_wrapper():
    """Mock async wrapper for testing"""
    wrapper = Mock()
    wrapper.get_records.return_value = {
        "status": "success",
        "data": []
    }
    wrapper.get_record.return_value = {
        "status": "success",
        "data": {"id": "test_id"}
    }
    wrapper.update_records.return_value = {
        "status": "success",
        "data": [{"status": "success"}]
    }
    wrapper.create_records.return_value = {
        "status": "success",
        "data": [{"status": "success", "details": {"id": "new_id"}}]
    }
    return wrapper


# Pytest configuration
def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "sdk: marks tests as SDK-specific tests"
    )
    config.addinivalue_line(
        "markers", "slow: marks tests as slow running"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers automatically"""
    for item in items:
        # Add integration marker to integration tests
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        
        # Add SDK marker to SDK tests
        if "sdk" in item.name.lower():
            item.add_marker(pytest.mark.sdk)