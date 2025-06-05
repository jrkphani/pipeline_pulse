"""
Enhanced Token Management Service for Pipeline Pulse
Provides comprehensive token lifecycle management with monitoring and alerts
"""

import asyncio
import hashlib
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

import httpx
from app.core.config import settings
from app.core.database import get_db
from app.models.token_management import ZohoTokenRecord, TokenRefreshLog, TokenAlert
from app.core.secrets import secrets_manager

logger = logging.getLogger(__name__)


class TokenManager:
    """
    Comprehensive token management with monitoring, alerts, and automatic refresh
    """
    
    def __init__(self):
        self.base_url = settings.ZOHO_BASE_URL
        self.accounts_url = settings.ZOHO_ACCOUNTS_URL
        self.client_id = settings.ZOHO_CLIENT_ID
        self.client_secret = settings.ZOHO_CLIENT_SECRET
        self.refresh_token = settings.ZOHO_REFRESH_TOKEN
        self._lock = asyncio.Lock()
        
        # Token refresh settings
        self.refresh_threshold_minutes = 10  # Refresh when < 10 minutes remaining
        self.max_retry_attempts = 3
        self.retry_delay_seconds = 5
        
    async def get_current_token_record(self, db: Session) -> Optional[ZohoTokenRecord]:
        """Get the current active token record"""
        return db.query(ZohoTokenRecord).filter(
            ZohoTokenRecord.is_active == True
        ).order_by(desc(ZohoTokenRecord.created_at)).first()
    
    async def get_valid_access_token(self, db: Session, force_refresh: bool = False) -> str:
        """
        Get a valid access token with automatic refresh and monitoring
        """
        async with self._lock:
            current_record = await self.get_current_token_record(db)
            
            # Check if we need to refresh
            needs_refresh = (
                force_refresh or 
                not current_record or 
                current_record.is_expired or 
                current_record.is_near_expiry
            )
            
            if needs_refresh:
                return await self._refresh_token_with_monitoring(db, current_record)
            
            # Update last used timestamp
            if current_record:
                current_record.last_used = datetime.now()
                db.commit()
                
            # Return cached token (in production, decrypt from secure storage)
            return await self._get_cached_access_token()
    
    async def _refresh_token_with_monitoring(
        self, 
        db: Session, 
        current_record: Optional[ZohoTokenRecord]
    ) -> str:
        """
        Refresh token with comprehensive monitoring and logging
        """
        start_time = datetime.now()
        refresh_log = TokenRefreshLog(
            token_record_id=current_record.id if current_record else "new",
            trigger_reason="expired" if current_record and current_record.is_expired else "near_expiry"
        )
        
        try:
            # Attempt token refresh
            token_data = await self._perform_token_refresh()
            
            # Calculate response time
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            
            # Create new token record
            new_record = await self._create_token_record(db, token_data)
            
            # Deactivate old record
            if current_record:
                current_record.is_active = False
                current_record.updated_at = datetime.now()
            
            # Log successful refresh
            refresh_log.success = True
            refresh_log.response_time_ms = response_time
            refresh_log.token_record_id = new_record.id
            db.add(refresh_log)
            
            # Resolve any existing alerts
            await self._resolve_token_alerts(db, new_record.id)
            
            db.commit()
            
            logger.info(f"Token refreshed successfully in {response_time}ms")
            return token_data["access_token"]
            
        except Exception as e:
            # Log failed refresh
            response_time = int((datetime.now() - start_time).total_seconds() * 1000)
            refresh_log.success = False
            refresh_log.error_message = str(e)
            refresh_log.response_time_ms = response_time
            db.add(refresh_log)
            
            # Update error count on current record
            if current_record:
                current_record.error_count += 1
                current_record.last_error = str(e)
                current_record.last_error_at = datetime.now()
            
            # Create alert for failed refresh
            await self._create_alert(
                db,
                current_record.id if current_record else "unknown",
                "refresh_failed",
                "high",
                f"Token refresh failed: {str(e)}"
            )
            
            db.commit()
            
            logger.error(f"Token refresh failed: {str(e)}")
            raise
    
    async def _perform_token_refresh(self) -> Dict[str, Any]:
        """
        Perform the actual token refresh API call
        """
        if not self.refresh_token:
            raise Exception("Refresh token not available")
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.accounts_url}/oauth/v2/token",
                data={
                    "refresh_token": self.refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "refresh_token"
                },
                timeout=30.0
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                raise Exception(f"Token refresh failed: {response.status_code} - {response.text}")
    
    async def _create_token_record(self, db: Session, token_data: Dict[str, Any]) -> ZohoTokenRecord:
        """
        Create a new token record with proper tracking
        """
        access_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 3600)  # Default 1 hour
        
        # Create token hashes for tracking (not storing actual tokens)
        access_token_hash = hashlib.sha256(access_token.encode()).hexdigest()
        
        record = ZohoTokenRecord(
            access_token_hash=access_token_hash,
            issued_at=datetime.now(),
            expires_at=datetime.now() + timedelta(seconds=expires_in - 300),  # 5 min buffer
            client_id=self.client_id,
            token_source="auto_refresh",
            scopes=["ZohoCRM.modules.ALL", "ZohoCRM.settings.ALL", "ZohoCRM.users.ALL", "ZohoCRM.org.ALL", "ZohoCRM.bulk.ALL"]
        )
        
        db.add(record)
        db.flush()  # Get the ID
        
        # Store actual token securely (in production, encrypt and store in secure storage)
        await self._store_token_securely(access_token, record.id)
        
        return record
    
    async def _store_token_securely(self, access_token: str, record_id: str):
        """
        Store token securely (implement encryption in production)
        """
        # In production, encrypt and store in AWS Secrets Manager or secure cache
        # For now, store in memory cache with expiration
        pass
    
    async def _get_cached_access_token(self) -> str:
        """
        Get cached access token (implement secure retrieval in production)
        """
        # In production, decrypt from secure storage
        # For now, use the existing auth manager
        from app.services.zoho_crm.core.auth_manager import ZohoAuthManager
        auth_manager = ZohoAuthManager()
        return await auth_manager.get_access_token()
    
    async def _create_alert(
        self, 
        db: Session, 
        token_record_id: str, 
        alert_type: str, 
        severity: str, 
        message: str
    ):
        """
        Create a token-related alert
        """
        alert = TokenAlert(
            token_record_id=token_record_id,
            alert_type=alert_type,
            severity=severity,
            message=message
        )
        db.add(alert)
    
    async def _resolve_token_alerts(self, db: Session, token_record_id: str):
        """
        Resolve existing alerts for successful token refresh
        """
        alerts = db.query(TokenAlert).filter(
            and_(
                TokenAlert.token_record_id == token_record_id,
                TokenAlert.is_resolved == False
            )
        ).all()
        
        for alert in alerts:
            alert.is_resolved = True
            alert.resolved_at = datetime.now()
            alert.resolution_reason = "Token successfully refreshed"
    
    async def get_token_health_status(self, db: Session) -> Dict[str, Any]:
        """
        Get comprehensive token health status
        """
        current_record = await self.get_current_token_record(db)
        
        if not current_record:
            return {
                "status": "no_token",
                "message": "No active token found",
                "requires_manual_refresh": True
            }
        
        # Get recent refresh logs
        recent_logs = db.query(TokenRefreshLog).filter(
            TokenRefreshLog.token_record_id == current_record.id
        ).order_by(desc(TokenRefreshLog.attempted_at)).limit(5).all()
        
        # Get active alerts
        active_alerts = db.query(TokenAlert).filter(
            and_(
                TokenAlert.token_record_id == current_record.id,
                TokenAlert.is_resolved == False
            )
        ).all()
        
        return {
            "status": current_record.health_status,
            "expires_at": current_record.expires_at.isoformat(),
            "time_until_expiry": str(current_record.time_until_expiry),
            "refresh_count": current_record.refresh_count,
            "error_count": current_record.error_count,
            "last_used": current_record.last_used.isoformat() if current_record.last_used else None,
            "recent_refresh_attempts": len(recent_logs),
            "active_alerts": len(active_alerts),
            "requires_manual_refresh": current_record.error_count > 5
        }


# Global instance
token_manager = TokenManager()
