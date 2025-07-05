from fastapi import APIRouter
from .endpoints import opportunities, sync_operations, auth, health, users, dashboard

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])
api_router.include_router(sync_operations.router, prefix="/sync", tags=["sync"])
api_router.include_router(dashboard.router, tags=["dashboard"])