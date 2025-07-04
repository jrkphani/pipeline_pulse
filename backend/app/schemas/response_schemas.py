from typing import Any, Dict, List, Optional, Generic, TypeVar
from pydantic import BaseModel, Field

T = TypeVar('T')


class BaseResponse(BaseModel):
    """Base response schema."""
    success: bool = True
    message: str = "Operation completed successfully"
    timestamp: str = Field(default_factory=lambda: __import__('datetime').datetime.utcnow().isoformat())


class ErrorResponse(BaseModel):
    """Error response schema."""
    success: bool = False
    error: str
    details: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: __import__('datetime').datetime.utcnow().isoformat())


class PaginatedResponse(BaseResponse, Generic[T]):
    """Paginated response schema."""
    data: List[T]
    total: int
    page: int = 1
    size: int = 20
    total_pages: int
    
    def __init__(self, **data):
        super().__init__(**data)
        if hasattr(self, 'total') and hasattr(self, 'size'):
            self.total_pages = (self.total + self.size - 1) // self.size