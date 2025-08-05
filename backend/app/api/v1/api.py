from fastapi import APIRouter
from .endpoints import opportunities, sync_operations, auth, health, users, dashboard, zoho_auth, zoho_only_auth, test_auth, test_fields, debug_zoho, minimal_test, test_with_auth, simple_fields

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(zoho_auth.router, prefix="/auth", tags=["zoho-integration"])
api_router.include_router(zoho_only_auth.router, prefix="/auth/zoho", tags=["zoho-authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(opportunities.router, prefix="/opportunities", tags=["opportunities"])
api_router.include_router(sync_operations.router, prefix="/sync", tags=["sync"])
api_router.include_router(dashboard.router, tags=["dashboard"])
api_router.include_router(test_auth.router, prefix="/test", tags=["testing"])
api_router.include_router(test_fields.router, prefix="/test", tags=["testing"])
api_router.include_router(debug_zoho.router, prefix="/debug", tags=["debugging"])
api_router.include_router(minimal_test.router, prefix="/minimal", tags=["testing"])
api_router.include_router(test_with_auth.router, prefix="/test-auth", tags=["testing"])
api_router.include_router(simple_fields.router, prefix="/simple", tags=["testing"])