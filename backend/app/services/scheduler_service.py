"""
Background Scheduler Service - SDK Migration

Handles scheduled tasks like weekly currency rate updates and CRM data synchronization using SDK.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.currency_service import currency_service
from app.services.data_sync_service import DataSyncService
from app.services.zoho_sdk_manager import get_sdk_manager
from app.models.crm_sync_sessions import CRMSyncSession, SyncSessionStatus, SyncOperationType

logger = logging.getLogger(__name__)

class SchedulerService:
    """Service for managing background scheduled tasks with SDK integration"""
    
    def __init__(self):
        self.running = False
        self.task: Optional[asyncio.Task] = None
        self.data_sync_service = DataSyncService()
        self.sdk_manager = get_sdk_manager()
        self.sync_interval_minutes = 15  # Default sync interval
        self.health_check_interval_minutes = 60  # Health check every hour
        self.last_health_check = None
        self.sync_statistics = {
            "total_syncs": 0,
            "successful_syncs": 0,
            "failed_syncs": 0,
            "last_sync_duration": 0
        }
        
    async def start(self):
        """Start the background scheduler with SDK initialization"""
        if self.running:
            logger.warning("Scheduler already running")
            return
        
        # Ensure SDK is initialized before starting
        if not self.sdk_manager.is_initialized():
            logger.warning("SDK not initialized, attempting initialization...")
            try:
                # Attempt to initialize SDK with default settings
                from app.core.config import settings
                self.sdk_manager.initialize_sdk(
                    client_id=settings.ZOHO_CLIENT_ID,
                    client_secret=settings.ZOHO_CLIENT_SECRET,
                    redirect_uri=settings.ZOHO_REDIRECT_URI,
                    refresh_token=settings.ZOHO_REFRESH_TOKEN,
                    data_center=settings.ZOHO_SDK_DATA_CENTER,
                    environment=settings.ZOHO_SDK_ENVIRONMENT
                )
                logger.info("SDK initialized successfully for scheduler")
            except Exception as e:
                logger.error(f"Failed to initialize SDK for scheduler: {e}")
                # Continue anyway, but sync operations may fail
        
        self.running = True
        self.task = asyncio.create_task(self._scheduler_loop())
        
        # Start CRM sync task with session tracking
        asyncio.create_task(self._start_crm_sync_with_tracking())
        
        # Start health monitoring task
        asyncio.create_task(self._start_health_monitoring())
        
        logger.info("🚀 Background scheduler started with SDK integration")
        
    async def stop(self):
        """Stop the background scheduler"""
        if not self.running:
            return
            
        self.running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("Background scheduler stopped")
        
    async def _scheduler_loop(self):
        """Main scheduler loop with SDK monitoring"""
        while self.running:
            try:
                await self._check_and_run_tasks()
                
                # Check SDK health periodically
                if self._should_check_sdk_health():
                    await self._check_sdk_health()
                
                # Check every hour
                await asyncio.sleep(3600)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
                
    async def _start_crm_sync_with_tracking(self):
        """Start the CRM data synchronization with session tracking"""
        try:
            logger.info("🔄 Starting SDK-based CRM data synchronization")
            
            # Create sync session tracking
            db = next(get_db())
            try:
                sync_session = CRMSyncSession(
                    session_type=SyncOperationType.INCREMENTAL_SYNC,
                    status=SyncSessionStatus.INITIATED,
                    module_name="Deals",
                    sync_direction="from_crm",
                    initiated_by="scheduler",
                    sync_config={
                        "sync_interval_minutes": self.sync_interval_minutes,
                        "sdk_enabled": True,
                        "scheduler_version": "2.0"
                    }
                )
                db.add(sync_session)
                db.commit()
                
                logger.info(f"Created sync session: {sync_session.id}")
                
                # Start the actual sync process
                await self._run_scheduled_sync_with_session(sync_session.id)
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error starting CRM sync with tracking: {e}")
            self.sync_statistics["failed_syncs"] += 1
                
    async def _check_and_run_tasks(self):
        """Check and run scheduled tasks with SDK integration"""
        try:
            # Check if currency rates need updating (weekly)
            await self._check_currency_rates()
            
            # Check SDK token status and refresh if needed
            await self._check_sdk_token_status()
            
            # Cleanup old sync sessions
            await self._cleanup_old_sync_sessions()
            
        except Exception as e:
            logger.error(f"Error checking scheduled tasks: {e}")
            
    async def _check_currency_rates(self):
        """Check if currency rates need updating and update if necessary"""
        try:
            # Get database session
            db_gen = get_db()
            db: Session = next(db_gen)
            
            try:
                # Check cache status
                from app.models.currency_rate import CurrencyRate
                cached_rates = db.query(CurrencyRate).all()
                
                if not cached_rates:
                    logger.info("No cached currency rates found, fetching fresh rates")
                    await self._update_currency_rates(db)
                    return
                
                # Check if rates are older than 7 days
                latest_update = max([r.updated_at for r in cached_rates])
                age_days = (datetime.utcnow() - latest_update).days
                
                if age_days >= 7:
                    logger.info(f"Currency rates are {age_days} days old, updating")
                    await self._update_currency_rates(db)
                else:
                    logger.debug(f"Currency rates are {age_days} days old, no update needed")
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error checking currency rates: {e}")
            
    async def _update_currency_rates(self, db: Session):
        """Update currency rates from external API"""
        try:
            logger.info("📈 Updating currency rates from external API")
            
            # Force refresh from API
            rates = currency_service.get_exchange_rates(db, force_refresh=True)
            
            if rates:
                logger.info(f"✅ Successfully updated {len(rates)} currency rates")
            else:
                logger.warning("⚠️ Failed to update currency rates")
                
        except Exception as e:
            logger.error(f"❌ Error updating currency rates: {e}")
    
    async def _start_health_monitoring(self):
        """Start health monitoring for SDK and sync operations"""
        while self.running:
            try:
                await asyncio.sleep(self.health_check_interval_minutes * 60)
                
                if self.running:  # Check if still running
                    await self._perform_health_check()
                    
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in health monitoring: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    async def _run_scheduled_sync_with_session(self, session_id: str):
        """Run scheduled sync with session tracking"""
        start_time = datetime.now()
        
        try:
            # Update session status
            await self._update_sync_session_status(session_id, SyncSessionStatus.IN_PROGRESS)
            
            # Run the actual sync
            sync_result = await self.data_sync_service.delta_sync()
            
            # Calculate duration
            duration = (datetime.now() - start_time).total_seconds()
            self.sync_statistics["last_sync_duration"] = duration
            
            if sync_result.get("status") == "success":
                self.sync_statistics["successful_syncs"] += 1
                await self._update_sync_session_status(
                    session_id, 
                    SyncSessionStatus.COMPLETED,
                    {
                        "records_processed": sync_result.get("deals_updated", 0),
                        "duration_seconds": duration,
                        "sync_method": "sdk_delta"
                    }
                )
                logger.info(f"✅ Scheduled sync completed successfully in {duration:.2f}s")
            else:
                self.sync_statistics["failed_syncs"] += 1
                await self._update_sync_session_status(
                    session_id,
                    SyncSessionStatus.FAILED,
                    {"error_message": sync_result.get("message", "Unknown error")}
                )
                logger.error(f"❌ Scheduled sync failed: {sync_result.get('message')}")
            
            self.sync_statistics["total_syncs"] += 1
            
        except Exception as e:
            self.sync_statistics["failed_syncs"] += 1
            self.sync_statistics["total_syncs"] += 1
            
            await self._update_sync_session_status(
                session_id,
                SyncSessionStatus.FAILED,
                {"error_message": str(e)}
            )
            logger.error(f"❌ Scheduled sync exception: {e}")
    
    async def _update_sync_session_status(
        self, 
        session_id: str, 
        status: SyncSessionStatus, 
        additional_data: Optional[Dict[str, Any]] = None
    ):
        """Update sync session status in database"""
        try:
            db = next(get_db())
            try:
                session = db.query(CRMSyncSession).filter(CRMSyncSession.id == session_id).first()
                if session:
                    session.status = status
                    session.last_activity_at = datetime.now()
                    
                    if status == SyncSessionStatus.COMPLETED:
                        session.completed_at = datetime.now()
                    
                    if additional_data:
                        if "records_processed" in additional_data:
                            session.processed_records = additional_data["records_processed"]
                            session.successful_records = additional_data["records_processed"]
                        
                        if "error_message" in additional_data:
                            session.error_message = additional_data["error_message"]
                    
                    db.commit()
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to update sync session status: {e}")
    
    async def _check_sdk_health(self):
        """Check SDK health and connectivity"""
        try:
            sdk_status = self.sdk_manager.validate_initialization()
            
            status = sdk_status.get("status")
            
            if status == "success":
                logger.debug("✅ SDK health check passed")
            elif status == "fallback_mode":
                logger.info("📝 SDK running in fallback mode - using HTTP-based Zoho service")
            else:
                logger.warning(f"⚠️ SDK health issue: {sdk_status.get('message')}")
                
                # Attempt to reinitialize with correct v8 pattern
                if not self.sdk_manager.is_initialized():
                    logger.info("Attempting to reinitialize SDK with v8 pattern...")
                    from app.core.config import settings
                    try:
                        success = self.sdk_manager.reinitialize(
                            client_id=settings.ZOHO_CLIENT_ID,
                            client_secret=settings.ZOHO_CLIENT_SECRET,
                            redirect_uri=settings.ZOHO_REDIRECT_URI,
                            refresh_token=settings.ZOHO_REFRESH_TOKEN,
                            data_center=settings.ZOHO_SDK_DATA_CENTER,
                            environment=settings.ZOHO_SDK_ENVIRONMENT
                        )
                        if success:
                            logger.info("✅ SDK reinitialized successfully with v8 pattern")
                        else:
                            logger.warning("⚠️ SDK reinitialization returned False")
                    except Exception as e:
                        logger.error(f"❌ SDK reinitialization failed: {e}")
                        logger.info("📝 Falling back to HTTP-based Zoho service")
            
            self.last_health_check = datetime.now()
            
        except Exception as e:
            logger.error(f"❌ SDK health check failed: {e}")
    
    def _should_check_sdk_health(self) -> bool:
        """Check if SDK health check is due"""
        if not self.last_health_check:
            return True
        
        time_since_check = datetime.now() - self.last_health_check
        return time_since_check.total_seconds() > (self.health_check_interval_minutes * 60)
    
    async def _check_sdk_token_status(self):
        """Check and refresh SDK tokens if needed"""
        try:
            # This would check token expiration and refresh if necessary
            # The SDK should handle this automatically, but we can add monitoring
            logger.debug("Checking SDK token status...")
            
        except Exception as e:
            logger.error(f"Error checking SDK token status: {e}")
    
    async def _cleanup_old_sync_sessions(self):
        """Cleanup old sync sessions to prevent database bloat"""
        try:
            # Keep sessions from last 7 days only
            cutoff_date = datetime.now() - timedelta(days=7)
            
            db = next(get_db())
            try:
                deleted_count = db.query(CRMSyncSession).filter(
                    CRMSyncSession.started_at < cutoff_date
                ).delete()
                
                if deleted_count > 0:
                    db.commit()
                    logger.info(f"🧹 Cleaned up {deleted_count} old sync sessions")
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Error cleaning up old sync sessions: {e}")
    
    async def _perform_health_check(self):
        """Perform comprehensive health check"""
        try:
            health_data = {
                "timestamp": datetime.now().isoformat(),
                "scheduler_running": self.running,
                "sync_statistics": self.sync_statistics.copy(),
                "sdk_status": self.sdk_manager.validate_initialization()
            }
            
            # Log health status
            success_rate = 0
            if self.sync_statistics["total_syncs"] > 0:
                success_rate = (self.sync_statistics["successful_syncs"] / self.sync_statistics["total_syncs"]) * 100
            
            logger.info(f"📊 Scheduler Health: {success_rate:.1f}% success rate, {self.sync_statistics['total_syncs']} total syncs")
            
        except Exception as e:
            logger.error(f"Error performing health check: {e}")
    
    def get_scheduler_status(self) -> Dict[str, Any]:
        """Get current scheduler status and statistics"""
        return {
            "running": self.running,
            "sync_interval_minutes": self.sync_interval_minutes,
            "health_check_interval_minutes": self.health_check_interval_minutes,
            "last_health_check": self.last_health_check.isoformat() if self.last_health_check else None,
            "sync_statistics": self.sync_statistics.copy(),
            "sdk_status": self.sdk_manager.validate_initialization() if self.sdk_manager else None
        }

# Global scheduler instance
scheduler_service = SchedulerService()


def get_scheduler_service() -> SchedulerService:
    """Get the global scheduler service instance"""
    return scheduler_service

# Startup and shutdown handlers
async def start_scheduler():
    """Start the background scheduler on app startup"""
    await scheduler_service.start()

async def stop_scheduler():
    """Stop the background scheduler on app shutdown"""
    await scheduler_service.stop()
