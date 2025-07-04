from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class User(Base):
    """User model for Pipeline Pulse."""
    
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    
    # Profile information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False, default="user")
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    
    # Audit fields
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    last_login = Column(DateTime, nullable=True)
    
    # Zoho CRM integration
    zoho_user_id = Column(String(50), nullable=True, unique=True, index=True)
    
    # Relationships
    created_opportunities = relationship(
        "Opportunity", 
        foreign_keys="Opportunity.created_by",
        back_populates="created_by_user"
    )
    updated_opportunities = relationship(
        "Opportunity", 
        foreign_keys="Opportunity.updated_by",
        back_populates="updated_by_user"
    )
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def can_create_opportunities(self) -> bool:
        """Check if user can create opportunities."""
        return self.is_active and self.role in ["admin", "sales_manager", "sales_rep"]
    
    @property
    def can_manage_sync(self) -> bool:
        """Check if user can manage sync operations."""
        return self.is_active and self.role in ["admin", "sales_manager"]
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"