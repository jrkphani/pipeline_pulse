from typing import Optional
from pydantic import BaseModel, EmailStr, Field, computed_field, ConfigDict
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole = UserRole.ae
    is_active: bool = True


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """Schema for user response."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None

    @computed_field
    @property
    def full_name(self) -> str:
        """Return full name combining first and last name."""
        return f"{self.first_name} {self.last_name}"


class LoginResponse(BaseModel):
    """Response returned on successful login.

    access_token is set both in the response body (for API / Swagger clients)
    and as an httpOnly cookie (for browser clients using withCredentials).
    """
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserLogin(BaseModel):
    """Schema for user login (JSON body variant)."""
    email: EmailStr
    password: str
