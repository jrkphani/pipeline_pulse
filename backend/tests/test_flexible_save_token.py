"""
Test suite for the flexible save_token method implementation
Tests both signatures: save_token(user, token) and save_token(token)
"""

import pytest
import tempfile
import os
from unittest.mock import Mock, patch
from datetime import datetime

from app.services.improved_zoho_token_store import ImprovedZohoTokenStore
from app.services.custom_sqlite_token_store import SQLiteTokenStore


class TestFlexibleSaveToken:
    """Test suite for the flexible save_token method implementation"""
    
    def setup_method(self):
        """Set up test database and stores"""
        self.temp_db = tempfile.NamedTemporaryFile(delete=False)
        self.temp_db_path = self.temp_db.name
        self.temp_db.close()
        
        # Initialize both token stores
        self.improved_store = ImprovedZohoTokenStore(db_path=self.temp_db_path)
        self.sqlite_store = SQLiteTokenStore(db_path=self.temp_db_path)
        
    def teardown_method(self):
        """Clean up test database"""
        if os.path.exists(self.temp_db_path):
            os.unlink(self.temp_db_path)
    
    def create_mock_token(self, user_mail=None, client_id="test_client", access_token="test_access"):
        """Create a mock OAuthToken object"""
        token = Mock()
        token.user_mail = user_mail
        token.client_id = client_id
        token.access_token = access_token
        token.refresh_token = "test_refresh"
        token.grant_token = "test_grant"
        token.expiry_time = str(int(datetime.now().timestamp()) + 3600)
        token.redirect_url = "https://example.com/callback"
        token.id = user_mail or "test@example.com"
        return token
    
    def create_mock_user(self, email="user@example.com"):
        """Create a mock user object"""
        user = Mock()
        user.email = email
        user.get_email = Mock(return_value=email)
        return user
    
    def test_improved_store_two_argument_signature(self):
        """Test ImprovedZohoTokenStore with save_token(user, token) signature"""
        user = self.create_mock_user("user@example.com")
        token = self.create_mock_token(client_id="test_client_123")
        
        # Test two-argument signature
        self.improved_store.save_token(user, token)
        
        # Verify token was saved correctly
        saved_token = self.improved_store.get_token(user, token)
        assert saved_token is not None
        assert saved_token.client_id == "test_client_123"
        assert saved_token.access_token == "test_access"
    
    def test_improved_store_one_argument_signature(self):
        """Test ImprovedZohoTokenStore with save_token(token) signature"""
        token = self.create_mock_token(user_mail="single@example.com", client_id="single_client")
        
        # Test one-argument signature
        self.improved_store.save_token(token)
        
        # Verify token was saved correctly
        user = self.create_mock_user("single@example.com")
        saved_token = self.improved_store.get_token(user, token)
        assert saved_token is not None
        assert saved_token.client_id == "single_client"
        assert saved_token.access_token == "test_access"
    
    def test_sqlite_store_two_argument_signature(self):
        """Test SQLiteTokenStore with save_token(user, token) signature"""
        user = self.create_mock_user("sqlite_user@example.com")
        token = self.create_mock_token(client_id="sqlite_client")
        
        # Test two-argument signature
        self.sqlite_store.save_token(user, token)
        
        # Verify token was saved correctly
        saved_token = self.sqlite_store.find_token(token)
        assert saved_token is not None
        assert saved_token.client_id == "sqlite_client"
        assert saved_token.access_token == "test_access"
    
    def test_sqlite_store_one_argument_signature(self):
        """Test SQLiteTokenStore with save_token(token) signature"""
        token = self.create_mock_token(client_id="sqlite_single_client")
        token.id = "sqlite_single@example.com"
        
        # Test one-argument signature
        self.sqlite_store.save_token(token)
        
        # Verify token was saved correctly
        saved_token = self.sqlite_store.find_token(token)
        assert saved_token is not None
        assert saved_token.client_id == "sqlite_single_client"
        assert saved_token.access_token == "test_access"
    
    def test_invalid_argument_count(self):
        """Test that invalid argument counts raise ValueError"""
        token = self.create_mock_token()
        
        # Test with no arguments
        with pytest.raises(ValueError, match="Invalid number of arguments"):
            self.improved_store.save_token()
        
        # Test with too many arguments
        with pytest.raises(ValueError, match="Invalid number of arguments"):
            self.improved_store.save_token("arg1", "arg2", "arg3")
    
    def test_backward_compatibility(self):
        """Test that existing code still works with the new implementation"""
        # Test existing two-argument usage
        user = self.create_mock_user("backward@example.com")
        token = self.create_mock_token(client_id="backward_client")
        
        # This should work exactly as before
        self.improved_store.save_token(user, token)
        
        # Verify functionality
        saved_token = self.improved_store.get_token(user, token)
        assert saved_token is not None
        assert saved_token.client_id == "backward_client"
    
    def test_token_without_user_mail_defaults(self):
        """Test that tokens without user_mail get default email"""
        token = self.create_mock_token()
        token.user_mail = None  # No user_mail attribute
        
        # Test one-argument signature with no user_mail
        self.improved_store.save_token(token)
        
        # Should use default email
        default_user = self.create_mock_user("default_email@example.com")
        saved_token = self.improved_store.get_token(default_user, token)
        assert saved_token is not None
    
    def test_user_extraction_methods(self):
        """Test various user extraction methods"""
        token = self.create_mock_token()
        
        # Test with user object having email attribute
        user_with_email = Mock()
        user_with_email.email = "email_attr@example.com"
        self.improved_store.save_token(user_with_email, token)
        
        # Test with user object having get_email method
        user_with_method = Mock()
        user_with_method.get_email = Mock(return_value="email_method@example.com")
        del user_with_method.email  # Remove email attribute
        self.improved_store.save_token(user_with_method, token)
        
        # Test with string user
        self.improved_store.save_token("string_user@example.com", token)
        
        # All should work without errors
        assert True
    
    def test_token_update_with_different_signatures(self):
        """Test updating existing tokens with different signatures"""
        user = self.create_mock_user("update@example.com")
        token = self.create_mock_token(client_id="update_client")
        
        # Save with two-argument signature
        self.improved_store.save_token(user, token)
        
        # Update with one-argument signature
        updated_token = self.create_mock_token(user_mail="update@example.com", 
                                             client_id="update_client",
                                             access_token="updated_access")
        self.improved_store.save_token(updated_token)
        
        # Verify the token was updated
        saved_token = self.improved_store.get_token(user, token)
        assert saved_token is not None
        assert saved_token.access_token == "updated_access"
    
    def test_error_handling_with_invalid_token(self):
        """Test error handling with invalid token objects"""
        # Test with None token
        with pytest.raises(AttributeError):
            self.improved_store.save_token(None)
        
        # Test with token missing required attributes
        invalid_token = Mock()
        # Remove all attributes that might exist
        for attr in ['client_id', '_client_id', 'access_token', '_access_token']:
            if hasattr(invalid_token, attr):
                delattr(invalid_token, attr)
        
        # Should not raise exception but might log warnings
        try:
            self.improved_store.save_token(invalid_token)
        except Exception as e:
            # Should be a database/storage error, not argument error
            assert "Invalid number of arguments" not in str(e)
    
    def test_mixed_usage_scenarios(self):
        """Test mixed usage scenarios in the same session"""
        # Scenario 1: Save with two args, retrieve with one
        user1 = self.create_mock_user("mixed1@example.com")
        token1 = self.create_mock_token(client_id="mixed1_client")
        self.improved_store.save_token(user1, token1)
        
        # Scenario 2: Save with one arg, retrieve normally
        token2 = self.create_mock_token(user_mail="mixed2@example.com", client_id="mixed2_client")
        self.improved_store.save_token(token2)
        
        # Verify both work
        saved1 = self.improved_store.get_token(user1, token1)
        assert saved1 is not None
        assert saved1.client_id == "mixed1_client"
        
        user2 = self.create_mock_user("mixed2@example.com")
        saved2 = self.improved_store.get_token(user2, token2)
        assert saved2 is not None
        assert saved2.client_id == "mixed2_client"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
