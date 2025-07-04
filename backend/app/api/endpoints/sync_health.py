from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.data_sync_service import DataSyncService

router = APIRouter()

@router.get("/sync/health")
def get_sync_health(db: Session = Depends(get_db)):
    sync_service = DataSyncService(db)
    return sync_service.get_sync_health()