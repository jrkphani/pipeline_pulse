from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Account(Base):
    """Account model for Pipeline Pulse."""
    
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    industry = Column(String(100), nullable=True, index=True)
    account_type = Column(String(50), nullable=False, default="prospect")
    
    # Territory assignment
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Zoho CRM integration
    zoho_account_id = Column(String(50), nullable=True, unique=True, index=True)
    
    # Relationships
    territory = relationship("Territory", back_populates="accounts")
    opportunities = relationship("Opportunity", back_populates="account")
    
    def __repr__(self) -> str:
        return f"<Account(id={self.id}, name='{self.name}', type='{self.account_type}')>"