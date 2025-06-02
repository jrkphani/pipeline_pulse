"""
Background Scheduler Service

Handles scheduled tasks like weekly currency rate updates.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.currency_service import currency_service

logger = logging.getLogger(__name__)

class SchedulerService:
    """Service for managing background scheduled tasks"""
    
    def __init__(self):
        self.running = False
        self.task: Optional[asyncio.Task] = None
        
    async def start(self):
        """Start the background scheduler"""
        if self.running:
            logger.warning("Scheduler already running")
            return
            
        self.running = True
        self.task = asyncio.create_task(self._scheduler_loop())
        logger.info("Background scheduler started")
        
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
        """Main scheduler loop"""
        while self.running:
            try:
                await self._check_and_run_tasks()
                # Check every hour
                await asyncio.sleep(3600)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
                
    async def _check_and_run_tasks(self):
        """Check and run scheduled tasks"""
        try:
            # Check if currency rates need updating (weekly)
            await self._check_currency_rates()
            
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
            logger.info("Updating currency rates from external API")
            
            # Force refresh from API
            rates = currency_service.get_exchange_rates(db, force_refresh=True)
            
            if rates:
                logger.info(f"Successfully updated {len(rates)} currency rates")
            else:
                logger.warning("Failed to update currency rates")
                
        except Exception as e:
            logger.error(f"Error updating currency rates: {e}")

# Global scheduler instance
scheduler_service = SchedulerService()

# Startup and shutdown handlers
async def start_scheduler():
    """Start the background scheduler on app startup"""
    await scheduler_service.start()

async def stop_scheduler():
    """Stop the background scheduler on app shutdown"""
    await scheduler_service.stop()
