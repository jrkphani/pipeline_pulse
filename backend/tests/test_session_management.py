"""
Test session management endpoints and database JWT persistence
Following Zoho SDK database token store pattern
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import json
from jose import jwt

from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings
from app.models.token_management import SessionToken

# Setup test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_session_management.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def create_test_jwt(user_email: str = "test@example.com", expires_in: int = 3600) -> str:
    """Create a test JWT token"""
    payload = {
        "sub": user_email,
        "user_id": "test_user_123",
        "region": "us-east-1",
        "name": "Test User",
        "roles": ["admin"],
        "exp": datetime.utcnow() + timedelta(seconds=expires_in),
        "iat": datetime.utcnow(),
        "iss": "pipeline-pulse-api"
    }
    
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def test_store_session_success():
    """Test storing a valid JWT session in database"""
    # Create a valid JWT token
    token = create_test_jwt()
    
    # Store the session
    response = client.post("/session/store", json={"token": token})
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["user_email"] == "test@example.com"
    assert data["user_id"] == "test_user_123"
    assert data["region"] == "us-east-1"
    assert "expires_at" in data

def test_store_session_invalid_token():
    """Test storing an invalid JWT token"""
    # Try to store invalid token
    response = client.post("/session/store", json={"token": "invalid_token"})
    
    assert response.status_code == 401
    assert "Invalid token" in response.json()["detail"]

def test_store_session_expired_token():
    """Test storing an expired JWT token"""
    # Create an expired token
    token = create_test_jwt(expires_in=-3600)  # Expired 1 hour ago
    
    # Try to store the expired token
    response = client.post("/session/store", json={"token": token})
    
    assert response.status_code == 401
    assert "Token is expired" in response.json()["detail"]

def test_retrieve_session_success():
    """Test retrieving a valid session from database"""
    # First store a session
    token = create_test_jwt()
    store_response = client.post("/session/store", json={"token": token})
    assert store_response.status_code == 200
    
    # Retrieve the session
    response = client.get("/session/retrieve")
    
    assert response.status_code == 200
    data = response.json()
    assert data["token"] == token
    assert data["user_email"] == "test@example.com"
    assert data["user_id"] == "test_user_123"
    assert data["region"] == "us-east-1"
    assert data["name"] == "Test User"
    assert data["roles"] == ["admin"]
    assert "expires_at" in data

def test_retrieve_session_not_found():
    """Test retrieving a session that doesn't exist"""
    # Clear any existing sessions
    client.delete("/session/clear-all")
    
    # Try to retrieve non-existent session
    response = client.get("/session/retrieve?user_id=nonexistent@example.com")
    
    assert response.status_code == 200
    data = response.json()
    assert data["token"] is None

def test_retrieve_session_expired():
    """Test retrieving an expired session"""
    # Create and store an expired token
    token = create_test_jwt(expires_in=-3600)  # Expired 1 hour ago
    
    # Manually insert expired session to bypass store validation
    db = TestingSessionLocal()
    expired_session = SessionToken(
        user_email="expired@example.com",
        user_id="expired_user",
        jwt_token=token,
        region="us-east-1",
        name="Expired User",
        roles=json.dumps(["admin"]),
        expires_at=datetime.utcnow() - timedelta(hours=1)  # Expired
    )
    db.add(expired_session)
    db.commit()
    db.close()
    
    # Try to retrieve the expired session
    response = client.get("/session/retrieve?user_id=expired@example.com")
    
    assert response.status_code == 200
    data = response.json()
    assert data["token"] is None  # Should be None because expired session was deleted

def test_clear_session_success():
    """Test clearing a specific session"""
    # First store a session
    token = create_test_jwt()
    store_response = client.post("/session/store", json={"token": token})
    assert store_response.status_code == 200
    
    # Clear the session
    response = client.post("/session/clear", json={"user_id": "test@example.com"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Session cleared" in data["message"]
    
    # Verify session is cleared
    retrieve_response = client.get("/session/retrieve")
    assert retrieve_response.json()["token"] is None

def test_clear_session_not_found():
    """Test clearing a session that doesn't exist"""
    response = client.post("/session/clear", json={"user_id": "nonexistent@example.com"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "No session found" in data["message"]

def test_clear_all_sessions():
    """Test clearing all sessions"""
    # Store multiple sessions
    token1 = create_test_jwt(user_email="user1@example.com")
    token2 = create_test_jwt(user_email="user2@example.com")
    
    client.post("/session/store", json={"token": token1})
    client.post("/session/store", json={"token": token2})
    
    # Clear all sessions
    response = client.delete("/session/clear-all")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "Cleared all sessions" in data["message"]
    
    # Verify all sessions are cleared
    retrieve_response = client.get("/session/retrieve")
    assert retrieve_response.json()["token"] is None

def test_get_all_sessions():
    """Test getting all stored sessions"""
    # Clear existing sessions
    client.delete("/session/clear-all")
    
    # Store multiple sessions
    token1 = create_test_jwt(user_email="user1@example.com")
    token2 = create_test_jwt(user_email="user2@example.com")
    
    client.post("/session/store", json={"token": token1})
    client.post("/session/store", json={"token": token2})
    
    # Get all sessions
    response = client.get("/session/all")
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["count"] == 2
    assert len(data["sessions"]) == 2
    
    # Verify session data
    sessions = data["sessions"]
    emails = [session["user_email"] for session in sessions]
    assert "user1@example.com" in emails
    assert "user2@example.com" in emails

def test_session_update_existing():
    """Test updating an existing session"""
    # Store initial session
    token1 = create_test_jwt(user_email="update_test@example.com")
    response1 = client.post("/session/store", json={"token": token1})
    assert response1.status_code == 200
    
    # Store new session for same user (should update)
    token2 = create_test_jwt(user_email="update_test@example.com", expires_in=7200)
    response2 = client.post("/session/store", json={"token": token2})
    assert response2.status_code == 200
    
    # Verify only one session exists and it's the updated one
    all_sessions = client.get("/session/all").json()
    user_sessions = [s for s in all_sessions["sessions"] if s["user_email"] == "update_test@example.com"]
    assert len(user_sessions) == 1  # Only one session should exist
    
    # Retrieve and verify it's the new token
    retrieve_response = client.get("/session/retrieve?user_id=update_test@example.com")
    assert retrieve_response.status_code == 200
    assert retrieve_response.json()["token"] == token2

def test_session_persistence_pattern():
    """Test that session management follows Zoho SDK database token store pattern"""
    # This test validates the pattern matches Zoho SDK behavior
    token = create_test_jwt()
    
    # Store token (equivalent to save_token)
    store_response = client.post("/session/store", json={"token": token})
    assert store_response.status_code == 200
    
    # Retrieve token (equivalent to find_token)
    retrieve_response = client.get("/session/retrieve")
    assert retrieve_response.status_code == 200
    assert retrieve_response.json()["token"] == token
    
    # Clear token (equivalent to delete_token)
    clear_response = client.post("/session/clear", json={})
    assert clear_response.status_code == 200
    
    # Verify token is cleared
    verify_response = client.get("/session/retrieve")
    assert verify_response.json()["token"] is None
    
    # Get all tokens (equivalent to get_tokens)
    all_response = client.get("/session/all")
    assert all_response.status_code == 200
    assert all_response.json()["count"] == 0

def test_jwt_validation_in_session():
    """Test that JWT validation works correctly in session management"""
    # Create token with specific payload
    payload = {
        "sub": "jwt_test@example.com",
        "user_id": "jwt_user_123",
        "region": "eu-west-1",
        "name": "JWT Test User",
        "roles": ["user", "admin"],
        "exp": datetime.utcnow() + timedelta(hours=1),
        "iat": datetime.utcnow(),
        "iss": "pipeline-pulse-api"
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    # Store and retrieve session
    client.post("/session/store", json={"token": token})
    response = client.get("/session/retrieve?user_id=jwt_test@example.com")
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify JWT payload is correctly stored and retrieved
    assert data["user_email"] == "jwt_test@example.com"
    assert data["user_id"] == "jwt_user_123"
    assert data["region"] == "eu-west-1"
    assert data["name"] == "JWT Test User"
    assert data["roles"] == ["user", "admin"]
    
    # Verify the token itself is valid
    decoded_token = jwt.decode(data["token"], settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    assert decoded_token["sub"] == "jwt_test@example.com"
    assert decoded_token["region"] == "eu-west-1"

# Cleanup
def test_cleanup():
    """Clean up test database"""
    client.delete("/session/clear-all")
    
    # Verify cleanup
    response = client.get("/session/all")
    assert response.json()["count"] == 0

if __name__ == "__main__":
    pytest.main([__file__])
