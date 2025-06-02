"""
Service for handling bulk update operations
"""

import uuid
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.models.bulk_update import (
    BulkUpdateBatch,
    BulkUpdateRecord,
    BulkUpdateRequest,
    UpdateStatus,
    SyncStatus
)
from app.models.analysis import Analysis
from app.services.zoho_service import ZohoService
from app.services.zoho_field_service import ZohoFieldService
import logging

logger = logging.getLogger(__name__)


class BulkUpdateService:
    """Service for handling bulk update operations"""

    def __init__(self):
        self.zoho_service = ZohoService()
        self.zoho_field_service = ZohoFieldService()

    async def get_records_for_update(
        self,
        db: Session,
        page: int = 1,
        limit: int = 100,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get paginated list of records available for bulk update
        """
        try:
            # Calculate offset
            offset = (page - 1) * limit

            # Build base query from Analysis table (which contains deal data)
            query = db.query(Analysis)

            # Apply search filter if provided
            if search:
                # Search in filename or data (JSON field)
                search_filter = or_(
                    Analysis.filename.ilike(f"%{search}%"),
                    Analysis.original_filename.ilike(f"%{search}%")
                )
                query = query.filter(search_filter)

            # Get total count
            total_count = query.count()

            # Apply pagination and get latest analysis
            analyses = query.filter(Analysis.is_latest == True).offset(offset).limit(limit).all()

            # Convert to API format - extract deal data from JSON
            records = []
            for analysis in analyses:
                try:
                    # Parse the JSON data to extract deals
                    import json as json_lib
                    data = json_lib.loads(analysis.data) if analysis.data else {}
                    deals = data.get('deals', [])

                    # Create records from deals data
                    for i, deal in enumerate(deals[:limit]):  # Limit deals per analysis
                        record = {
                            "id": f"{analysis.id}_{i}",  # Composite ID
                            "opportunity_name": deal.get('Deal Name', ''),
                            "account_name": deal.get('Account Name', ''),
                            "stage": deal.get('Stage', ''),
                            "owner": deal.get('Deal Owner', ''),
                            "amount": float(deal.get('SGD Amount', 0)),
                            "currency": "SGD",
                            "closing_date": deal.get('Closing Date', ''),
                            "zoho_id": deal.get('Record Id', ''),
                            "probability": int(deal.get('Probability (%)', 0)),
                            "territory": deal.get('Territory', ''),
                            "service_type": deal.get('Service Type', ''),
                            "funding_type": deal.get('Funding Type', '')
                        }
                        records.append(record)

                        if len(records) >= limit:
                            break

                    if len(records) >= limit:
                        break

                except Exception as e:
                    logger.error(f"Error parsing analysis data: {str(e)}")
                    continue

            return {
                "data": records,
                "total": total_count,
                "page": page,
                "limit": limit,
                "total_pages": (total_count + limit - 1) // limit
            }

        except Exception as e:
            logger.error(f"Error fetching records for update: {str(e)}")
            raise

    async def execute_bulk_update(self, request: BulkUpdateRequest, db: Session) -> Dict[str, Any]:
        """
        Execute bulk update operation on local database
        """
        try:
            # Generate batch ID
            batch_id = str(uuid.uuid4())

            # Create batch record
            batch = BulkUpdateBatch(
                batch_id=batch_id,
                field_name=request.field_name,
                field_value=json.dumps(request.field_value),
                total_records=len(request.record_ids),
                created_by=request.updated_by,
                status=UpdateStatus.IN_PROGRESS
            )
            db.add(batch)
            db.flush()  # Get the batch ID

            successful_updates = 0
            failed_updates = 0

            # Process each record (for now, just track the update request)
            # Note: Since we're using Analysis table which stores JSON data,
            # we'll track the bulk update but actual updates will be applied during CRM sync
            for record_id in request.record_ids:
                try:
                    # Parse record_id to get analysis_id and deal_index
                    if "_" in record_id:
                        analysis_id, deal_index = record_id.split("_", 1)
                        deal_index = int(deal_index)
                    else:
                        # Invalid record ID format
                        record_update = BulkUpdateRecord(
                            batch_id=batch_id,
                            record_id=record_id,
                            status=UpdateStatus.FAILED,
                            error_message=f"Invalid record ID format: {record_id}"
                        )
                        db.add(record_update)
                        failed_updates += 1
                        continue

                    # Find the analysis record
                    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()

                    if not analysis:
                        record_update = BulkUpdateRecord(
                            batch_id=batch_id,
                            record_id=record_id,
                            status=UpdateStatus.FAILED,
                            error_message=f"Analysis {analysis_id} not found"
                        )
                        db.add(record_update)
                        failed_updates += 1
                        continue

                    # Parse the JSON data to get the specific deal
                    try:
                        import json as json_lib
                        data = json_lib.loads(analysis.data) if analysis.data else {}
                        deals = data.get('deals', [])

                        if deal_index >= len(deals):
                            record_update = BulkUpdateRecord(
                                batch_id=batch_id,
                                record_id=record_id,
                                status=UpdateStatus.FAILED,
                                error_message=f"Deal index {deal_index} not found in analysis"
                            )
                            db.add(record_update)
                            failed_updates += 1
                            continue

                        deal = deals[deal_index]
                        old_value = deal.get(request.field_name, None)
                        zoho_id = deal.get('Record Id', '')

                        # Update the deal data in JSON
                        deals[deal_index][request.field_name] = request.field_value
                        data['deals'] = deals
                        analysis.data = json_lib.dumps(data)

                        # Create record update tracking
                        record_update = BulkUpdateRecord(
                            batch_id=batch_id,
                            record_id=record_id,
                            zoho_id=zoho_id,
                            old_value=json.dumps(old_value) if old_value is not None else None,
                            new_value=json.dumps(request.field_value),
                            status=UpdateStatus.COMPLETED
                        )
                        db.add(record_update)
                        successful_updates += 1

                    except (json.JSONDecodeError, KeyError, IndexError) as e:
                        record_update = BulkUpdateRecord(
                            batch_id=batch_id,
                            record_id=record_id,
                            status=UpdateStatus.FAILED,
                            error_message=f"Error parsing deal data: {str(e)}"
                        )
                        db.add(record_update)
                        failed_updates += 1

                except Exception as e:
                    logger.error(f"Error updating record {record_id}: {str(e)}")
                    record_update = BulkUpdateRecord(
                        batch_id=batch_id,
                        record_id=record_id,
                        status=UpdateStatus.FAILED,
                        error_message=str(e)
                    )
                    db.add(record_update)
                    failed_updates += 1

            # Update batch status
            batch.successful_updates = successful_updates
            batch.failed_updates = failed_updates
            batch.status = UpdateStatus.COMPLETED
            batch.updated_at = datetime.now()

            # Commit all changes
            db.commit()

            logger.info(f"Bulk update completed: {successful_updates} successful, {failed_updates} failed")

            return {
                "batch_id": batch_id,
                "total_records": len(request.record_ids),
                "successful_updates": successful_updates,
                "failed_updates": failed_updates,
                "status": UpdateStatus.COMPLETED
            }

        except Exception as e:
            db.rollback()
            logger.error(f"Error executing bulk update: {str(e)}")
            raise

    async def get_batch_details(self, batch_id: str, db: Session) -> Optional[Dict[str, Any]]:
        """
        Get details of a bulk update batch
        """
        try:
            batch = db.query(BulkUpdateBatch).filter(
                BulkUpdateBatch.batch_id == batch_id
            ).first()

            if not batch:
                return None

            return {
                "batch_id": batch.batch_id,
                "field_name": batch.field_name,
                "field_value": json.loads(batch.field_value),
                "total_records": batch.total_records,
                "successful_updates": batch.successful_updates,
                "failed_updates": batch.failed_updates,
                "status": batch.status,
                "sync_status": batch.sync_status,
                "created_at": batch.created_at.isoformat(),
                "updated_at": batch.updated_at.isoformat(),
                "created_by": batch.created_by,
                "error_details": json.loads(batch.error_details) if batch.error_details else None
            }

        except Exception as e:
            logger.error(f"Error fetching batch details: {str(e)}")
            raise

    async def get_batch_record_statuses(self, batch_id: str, db: Session) -> List[Dict[str, Any]]:
        """
        Get status of individual records in a batch
        """
        try:
            records = db.query(BulkUpdateRecord).filter(
                BulkUpdateRecord.batch_id == batch_id
            ).all()

            return [
                {
                    "record_id": record.record_id,
                    "zoho_id": record.zoho_id,
                    "old_value": json.loads(record.old_value) if record.old_value else None,
                    "new_value": json.loads(record.new_value) if record.new_value else None,
                    "status": record.status,
                    "sync_status": record.sync_status,
                    "error_message": record.error_message,
                    "updated_at": record.updated_at.isoformat() if record.updated_at else None,
                    "synced_at": record.synced_at.isoformat() if record.synced_at else None
                }
                for record in records
            ]

        except Exception as e:
            logger.error(f"Error fetching batch record statuses: {str(e)}")
            raise

    async def sync_to_crm_background(self, batch_id: str, db: Session):
        """
        Background task to sync updates to Zoho CRM
        """
        try:
            # Update batch sync status to syncing
            batch = db.query(BulkUpdateBatch).filter(
                BulkUpdateBatch.batch_id == batch_id
            ).first()

            if not batch:
                logger.error(f"Batch {batch_id} not found for CRM sync")
                return

            # Update sync status
            db.execute(
                BulkUpdateBatch.__table__.update()
                .where(BulkUpdateBatch.batch_id == batch_id)
                .values(sync_status=SyncStatus.SYNCING)
            )
            db.commit()

            # Get successful records to sync
            records = db.query(BulkUpdateRecord).filter(
                and_(
                    BulkUpdateRecord.batch_id == batch_id,
                    BulkUpdateRecord.status == UpdateStatus.COMPLETED,
                    BulkUpdateRecord.zoho_id.isnot(None)
                )
            ).all()

            synced_count = 0
            failed_count = 0

            # Sync each record to Zoho CRM
            for record in records:
                try:
                    if record.zoho_id:
                        # Prepare update data for Zoho
                        update_data = {
                            batch.field_name: json.loads(record.new_value)
                        }

                        # Update in Zoho CRM
                        await self.zoho_service.update_deal(record.zoho_id, update_data)

                        # Update record sync status
                        db.execute(
                            BulkUpdateRecord.__table__.update()
                            .where(BulkUpdateRecord.id == record.id)
                            .values(
                                sync_status=SyncStatus.SYNCED,
                                synced_at=datetime.now()
                            )
                        )
                        synced_count += 1

                except Exception as e:
                    logger.error(f"Error syncing record {record.record_id} to CRM: {str(e)}")
                    db.execute(
                        BulkUpdateRecord.__table__.update()
                        .where(BulkUpdateRecord.id == record.id)
                        .values(
                            sync_status=SyncStatus.SYNC_FAILED,
                            error_message=f"CRM sync failed: {str(e)}"
                        )
                    )
                    failed_count += 1

            # Update batch sync status
            final_sync_status = SyncStatus.SYNCED if failed_count == 0 else SyncStatus.SYNC_FAILED
            db.execute(
                BulkUpdateBatch.__table__.update()
                .where(BulkUpdateBatch.batch_id == batch_id)
                .values(sync_status=final_sync_status)
            )
            db.commit()

            logger.info(f"CRM sync completed for batch {batch_id}: {synced_count} synced, {failed_count} failed")

        except Exception as e:
            logger.error(f"Error in CRM sync background task: {str(e)}")
            # Update batch sync status to failed
            db.execute(
                BulkUpdateBatch.__table__.update()
                .where(BulkUpdateBatch.batch_id == batch_id)
                .values(sync_status=SyncStatus.SYNC_FAILED)
            )
            db.commit()

    async def validate_field_and_value(
        self,
        field_name: str,
        field_value: Any,
        module: str = "Deals",
        db: Session = None
    ) -> Dict[str, Any]:
        """
        Validate field and value for bulk update
        """
        try:
            return await self.zoho_field_service.validate_field_value(
                field_name, field_value, module
            )
        except Exception as e:
            logger.error(f"Error validating field {field_name}: {str(e)}")
            return {
                "valid": False,
                "error": f"Validation error: {str(e)}"
            }

    async def get_update_batches(
        self,
        page: int = 1,
        limit: int = 20,
        created_by: Optional[str] = None,
        db: Session = None
    ) -> Dict[str, Any]:
        """
        Get paginated list of bulk update batches
        """
        try:
            # Calculate offset
            offset = (page - 1) * limit

            # Build query
            query = db.query(BulkUpdateBatch)

            # Apply filter if provided
            if created_by:
                query = query.filter(BulkUpdateBatch.created_by == created_by)

            # Get total count
            total_count = query.count()

            # Apply pagination and ordering
            batches = query.order_by(BulkUpdateBatch.created_at.desc()).offset(offset).limit(limit).all()

            # Convert to API format
            batch_list = []
            for batch in batches:
                batch_data = {
                    "batch_id": batch.batch_id,
                    "field_name": batch.field_name,
                    "field_value": json.loads(batch.field_value),
                    "total_records": batch.total_records,
                    "successful_updates": batch.successful_updates,
                    "failed_updates": batch.failed_updates,
                    "status": batch.status,
                    "sync_status": batch.sync_status,
                    "created_at": batch.created_at.isoformat(),
                    "updated_at": batch.updated_at.isoformat(),
                    "created_by": batch.created_by
                }
                batch_list.append(batch_data)

            return {
                "data": batch_list,
                "total": total_count,
                "page": page,
                "limit": limit,
                "total_pages": (total_count + limit - 1) // limit
            }

        except Exception as e:
            logger.error(f"Error fetching update batches: {str(e)}")
            raise

    async def delete_batch(self, batch_id: str, db: Session) -> bool:
        """
        Delete a bulk update batch and its records
        """
        try:
            # Check if batch exists
            batch = db.query(BulkUpdateBatch).filter(
                BulkUpdateBatch.batch_id == batch_id
            ).first()

            if not batch:
                return False

            # Delete related records first (cascade should handle this, but being explicit)
            db.query(BulkUpdateRecord).filter(
                BulkUpdateRecord.batch_id == batch_id
            ).delete()

            # Delete the batch
            db.delete(batch)
            db.commit()

            logger.info(f"Deleted batch {batch_id} and its records")
            return True

        except Exception as e:
            db.rollback()
            logger.error(f"Error deleting batch {batch_id}: {str(e)}")
            raise