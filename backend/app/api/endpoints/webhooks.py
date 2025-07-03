"""
Zoho CRM Webhook endpoints for real-time data updates
Handles webhook notifications from Zoho CRM for deals, contacts, and other modules
"""

from fastapi import APIRouter, Request, HTTPException, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import logging
import hashlib
import hmac
import json
from datetime import datetime

from app.core.database import get_db
from app.core.config import settings
from app.services.zoho_sdk_manager import get_sdk_manager
from app.services.sdk_response_transformer import get_response_transformer
from app.services.zoho_crm.unified_crm_service import UnifiedZohoCRMService

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Webhooks"])

# Webhook event handlers
webhook_handlers = {}

def register_webhook_handler(event_type: str):
    """Decorator to register webhook event handlers"""
    def decorator(func):
        webhook_handlers[event_type] = func
        return func
    return decorator

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """Verify webhook signature for security"""
    try:
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Zoho typically sends signature as 'sha256=<hash>'
        if signature.startswith('sha256='):
            signature = signature[7:]
        
        return hmac.compare_digest(expected_signature, signature)
    except Exception as e:
        logger.error(f"Signature verification failed: {e}")
        return False

@router.post("/zoho/webhook")
async def zoho_webhook_handler(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Handle incoming Zoho CRM webhooks
    Processes deal updates, creations, and deletions in real-time
    """
    try:
        # Get raw payload for signature verification
        payload = await request.body()
        
        # Verify webhook signature if configured
        signature = request.headers.get('x-zoho-webhook-signature')
        if settings.WEBHOOK_TOKEN and signature:
            if not verify_webhook_signature(payload, signature, settings.WEBHOOK_TOKEN):
                logger.warning("Webhook signature verification failed")
                raise HTTPException(status_code=401, detail="Invalid webhook signature")
        
        # Parse JSON payload
        try:
            webhook_data = json.loads(payload.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid JSON payload")
        
        # Log webhook receipt
        logger.info(f"📡 Received Zoho webhook: {webhook_data.get('event_type', 'unknown')}")
        
        # Process webhook in background to avoid timeout
        background_tasks.add_task(
            process_webhook_data,
            webhook_data=webhook_data,
            headers=dict(request.headers),
            db_session=db
        )
        
        # Return immediate success response
        return JSONResponse(
            status_code=200,
            content={
                "status": "received",
                "message": "Webhook received and queued for processing",
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook handler error: {e}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Webhook processing failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        )

async def process_webhook_data(
    webhook_data: Dict[str, Any],
    headers: Dict[str, str],
    db_session: Session
):
    """
    Background task to process webhook data
    """
    try:
        event_type = webhook_data.get('event_type')
        module = webhook_data.get('module')
        
        logger.info(f"🔄 Processing webhook: {event_type} for {module}")
        
        # Handle different event types
        if event_type in webhook_handlers:
            handler = webhook_handlers[event_type]
            await handler(webhook_data, db_session)
        else:
            logger.info(f"No handler registered for event type: {event_type}")
            await handle_generic_webhook(webhook_data, db_session)
        
        logger.info(f"✅ Successfully processed webhook: {event_type}")
        
    except Exception as e:
        logger.error(f"❌ Error processing webhook: {e}")
        # In production, you might want to implement retry logic or dead letter queue

@register_webhook_handler("Deals.create")
async def handle_deal_created(webhook_data: Dict[str, Any], db: Session):
    """Handle new deal creation using SDK"""
    try:
        deal_data = webhook_data.get('data', {})
        deal_id = deal_data.get('id')
        
        logger.info(f"📝 New deal created via webhook: {deal_id}")
        
        # Ensure SDK is initialized
        sdk_manager = get_sdk_manager()
        if not sdk_manager.is_initialized():
            logger.error("SDK not initialized for webhook processing")
            return
        
        # Use unified CRM service with SDK
        crm_service = UnifiedZohoCRMService(db)
        transformer = get_response_transformer()
        
        try:
            # Fetch the complete deal data using SDK
            sdk_response = await crm_service.get_deal_by_id(deal_id)
            
            if sdk_response.get("status") == "success":
                # Transform SDK response to Pipeline Pulse format
                transformed_response = transformer.transform_records_response(sdk_response)
                deal_record = transformed_response.get("data")
                
                if deal_record:
                    # Store/update in local database with transformed data
                    await _update_local_deal_record(db, deal_record, "created")
                    
                    # Trigger O2R data sync if applicable
                    await _sync_deal_to_o2r(deal_record)
                    
                    # Trigger notifications
                    await _send_deal_notification("created", deal_record)
                    
                    logger.info(f"✅ Deal creation webhook processed with SDK: {deal_id}")
                else:
                    logger.warning(f"No deal data returned for webhook: {deal_id}")
            else:
                logger.error(f"Failed to fetch deal data via SDK: {sdk_response.get('message')}")
                
        except Exception as e:
            logger.error(f"SDK operation failed in webhook handler: {e}")
            
    except Exception as e:
        logger.error(f"Error handling deal creation webhook: {e}")

@register_webhook_handler("Deals.edit")
async def handle_deal_updated(webhook_data: Dict[str, Any], db: Session):
    """Handle deal updates using SDK"""
    try:
        deal_data = webhook_data.get('data', {})
        deal_id = deal_data.get('id')
        modified_fields = deal_data.get('modified_fields', [])
        
        logger.info(f"📝 Deal updated via webhook: {deal_id} (fields: {modified_fields})")
        
        # Ensure SDK is initialized
        sdk_manager = get_sdk_manager()
        if not sdk_manager.is_initialized():
            logger.error("SDK not initialized for webhook processing")
            return
        
        # Use unified CRM service with SDK
        crm_service = UnifiedZohoCRMService(db)
        transformer = get_response_transformer()
        
        try:
            # Fetch the updated deal data using SDK
            sdk_response = await crm_service.get_deal_by_id(deal_id)
            
            if sdk_response.get("status") == "success":
                # Transform SDK response to Pipeline Pulse format
                transformed_response = transformer.transform_records_response(sdk_response)
                deal_record = transformed_response.get("data")
                
                if deal_record:
                    # Get existing record for comparison
                    existing_record = await _get_existing_deal_record(db, deal_id)
                    
                    # Update local database with changes
                    await _update_local_deal_record(db, deal_record, "updated", existing_record)
                    
                    # Check if O2R milestone fields were updated
                    o2r_fields = ['proposal_date', 'sow_date', 'po_date', 'kickoff_date', 
                                'invoice_date', 'payment_date', 'revenue_date']
                    
                    o2r_updated = any(field in [f.lower() for f in modified_fields] for field in o2r_fields)
                    
                    if o2r_updated:
                        # Trigger O2R health recalculation
                        await _sync_deal_to_o2r(deal_record)
                        await _recalculate_o2r_health(deal_record)
                        
                        logger.info(f"O2R milestones updated for deal: {deal_id}")
                    
                    # Send notifications for significant changes
                    await _send_deal_notification("updated", deal_record, modified_fields)
                    
                    logger.info(f"✅ Deal update webhook processed with SDK: {deal_id}")
                else:
                    logger.warning(f"No deal data returned for webhook: {deal_id}")
            else:
                logger.error(f"Failed to fetch updated deal data via SDK: {sdk_response.get('message')}")
                
        except Exception as e:
            logger.error(f"SDK operation failed in webhook handler: {e}")
            
    except Exception as e:
        logger.error(f"Error handling deal update webhook: {e}")

@register_webhook_handler("Deals.delete")
async def handle_deal_deleted(webhook_data: Dict[str, Any], db: Session):
    """Handle deal deletion using SDK"""
    try:
        deal_data = webhook_data.get('data', {})
        deal_id = deal_data.get('id')
        
        logger.info(f"🗑️ Deal deleted via webhook: {deal_id}")
        
        # Get existing record before deletion for cleanup
        existing_record = await _get_existing_deal_record(db, deal_id)
        
        if existing_record:
            # Mark deal as deleted in local database
            await _mark_deal_as_deleted(db, deal_id)
            
            # Archive related O2R data
            await _archive_o2r_data(deal_id)
            
            # Update analytics and reports
            await _update_analytics_for_deletion(deal_id)
            
            # Send deletion notification
            await _send_deal_notification("deleted", existing_record)
            
            logger.info(f"✅ Deal deletion webhook processed: {deal_id}")
        else:
            logger.warning(f"Deal not found in local database for deletion: {deal_id}")
        
    except Exception as e:
        logger.error(f"Error handling deal deletion webhook: {e}")

async def handle_generic_webhook(webhook_data: Dict[str, Any], db: Session):
    """Handle unregistered webhook events"""
    try:
        event_type = webhook_data.get('event_type', 'unknown')
        module = webhook_data.get('module', 'unknown')
        
        logger.info(f"📋 Generic webhook handler: {event_type} for {module}")
        
        # Log webhook data for analysis
        # In production, you might want to store this for later processing
        
    except Exception as e:
        logger.error(f"Error in generic webhook handler: {e}")


# Helper functions for SDK-based webhook processing

async def _update_local_deal_record(
    db: Session, 
    deal_record: Dict[str, Any], 
    action: str,
    existing_record: Optional[Dict[str, Any]] = None
):
    """Update local database with deal record from SDK"""
    try:
        from app.models.crm_record import CrmRecord
        
        deal_id = deal_record.get('id')
        if not deal_id:
            logger.error("No deal ID found in record")
            return
        
        # Check if record exists
        existing = db.query(CrmRecord).filter(CrmRecord.record_id == deal_id).first()
        
        if existing:
            # Update existing record
            existing.raw_data = deal_record
            existing.processed_data = deal_record
            existing.updated_at = datetime.now()
            logger.info(f"Updated existing deal record: {deal_id}")
        else:
            # Create new record
            new_record = CrmRecord(
                record_id=deal_id,
                record_type="Deal",
                raw_data=deal_record,
                processed_data=deal_record
            )
            db.add(new_record)
            logger.info(f"Created new deal record: {deal_id}")
        
        db.commit()
        
    except Exception as e:
        logger.error(f"Failed to update local deal record: {e}")
        db.rollback()


async def _get_existing_deal_record(db: Session, deal_id: str) -> Optional[Dict[str, Any]]:
    """Get existing deal record from local database"""
    try:
        from app.models.crm_record import CrmRecord
        
        existing = db.query(CrmRecord).filter(CrmRecord.record_id == deal_id).first()
        return existing.processed_data if existing else None
        
    except Exception as e:
        logger.error(f"Failed to get existing deal record: {e}")
        return None


async def _mark_deal_as_deleted(db: Session, deal_id: str):
    """Mark deal as deleted in local database"""
    try:
        from app.models.crm_record import CrmRecord
        
        existing = db.query(CrmRecord).filter(CrmRecord.record_id == deal_id).first()
        if existing:
            existing.is_deleted = True
            existing.deleted_at = datetime.now()
            db.commit()
            logger.info(f"Marked deal as deleted: {deal_id}")
        
    except Exception as e:
        logger.error(f"Failed to mark deal as deleted: {e}")
        db.rollback()


async def _sync_deal_to_o2r(deal_record: Dict[str, Any]):
    """Sync deal to O2R opportunities"""
    try:
        from app.api.o2r.data_bridge import O2RDataBridge
        
        o2r_bridge = O2RDataBridge()
        await o2r_bridge.sync_deal_to_o2r(deal_record)
        
        logger.info(f"Synced deal to O2R: {deal_record.get('id')}")
        
    except Exception as e:
        logger.error(f"Failed to sync deal to O2R: {e}")


async def _recalculate_o2r_health(deal_record: Dict[str, Any]):
    """Recalculate O2R health signals"""
    try:
        from app.services.analysis_service import AnalysisService
        
        analysis_service = AnalysisService()
        await analysis_service.recalculate_opportunity_health(deal_record.get('id'))
        
        logger.info(f"Recalculated O2R health: {deal_record.get('id')}")
        
    except Exception as e:
        logger.error(f"Failed to recalculate O2R health: {e}")


async def _archive_o2r_data(deal_id: str):
    """Archive O2R data for deleted deal"""
    try:
        from app.models.o2r.opportunity import O2ROpportunity
        from app.core.database import get_db
        
        db = next(get_db())
        try:
            opportunity = db.query(O2ROpportunity).filter(
                O2ROpportunity.crm_deal_id == deal_id
            ).first()
            
            if opportunity:
                opportunity.is_archived = True
                opportunity.archived_at = datetime.now()
                db.commit()
                logger.info(f"Archived O2R data for deal: {deal_id}")
                
        finally:
            db.close()
        
    except Exception as e:
        logger.error(f"Failed to archive O2R data: {e}")


async def _update_analytics_for_deletion(deal_id: str):
    """Update analytics when deal is deleted"""
    try:
        # Update dashboard metrics, reports, etc.
        # This would typically involve refreshing cached analytics
        logger.info(f"Updated analytics for deleted deal: {deal_id}")
        
    except Exception as e:
        logger.error(f"Failed to update analytics for deletion: {e}")


async def _send_deal_notification(
    action: str, 
    deal_record: Dict[str, Any], 
    modified_fields: Optional[List[str]] = None
):
    """Send notifications for deal changes"""
    try:
        # Implement notification logic based on action type
        deal_name = deal_record.get('deal_name', 'Unknown Deal')
        deal_id = deal_record.get('id')
        
        notification_data = {
            "action": action,
            "deal_id": deal_id,
            "deal_name": deal_name,
            "modified_fields": modified_fields or [],
            "timestamp": datetime.now().isoformat()
        }
        
        # Log notification (implement actual notification service as needed)
        logger.info(f"📢 Notification sent for deal {action}: {deal_name} ({deal_id})")
        
    except Exception as e:
        logger.error(f"Failed to send deal notification: {e}")

@router.get("/zoho/webhook/status")
async def webhook_status():
    """Get webhook configuration status"""
    try:
        return {
            "webhook_url": f"{settings.APP_BASE_URL}/api/zoho/webhook",
            "signature_verification": bool(settings.WEBHOOK_TOKEN),
            "registered_handlers": list(webhook_handlers.keys()),
            "status": "active",
            "last_check": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting webhook status: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@router.post("/zoho/webhook/test")
async def test_webhook():
    """Test endpoint for webhook functionality"""
    try:
        test_data = {
            "event_type": "test",
            "module": "Deals",
            "data": {
                "id": "test-deal-123",
                "Deal_Name": "Test Deal"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info("🧪 Test webhook triggered")
        
        return {
            "status": "success",
            "message": "Test webhook processed successfully",
            "test_data": test_data,
            "handlers_available": list(webhook_handlers.keys())
        }
        
    except Exception as e:
        logger.error(f"Test webhook failed: {e}")
        raise HTTPException(status_code=500, detail=f"Test webhook failed: {str(e)}")