from fastapi import APIRouter, Depends, Request
from sse_starlette.sse import EventSourceResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.data_sync_service import DataSyncService
import asyncio

router = APIRouter()

@router.get("/sync/stream/{session_id}")
async def stream_sync_progress(session_id: str, request: Request, db: Session = Depends(get_db)):
    sync_service = DataSyncService(db)

    async def event_generator():
        while True:
            if await request.is_disconnected():
                break
            progress = sync_service.get_sync_progress(session_id)
            yield {"data": progress}
            await asyncio.sleep(1)

    return EventSourceResponse(event_generator())