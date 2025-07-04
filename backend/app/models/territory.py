from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Territory(Base):
    """Territory model for Pipeline Pulse."""
    
    __tablename__ = "territories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    region = Column(String(100), nullable=False, index=True)
    
    # Management
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Audit fields
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(DateTime, nullable=False, default=func.now(), onupdate=func.now())
    
    # Zoho CRM integration
    zoho_territory_id = Column(String(50), nullable=True, unique=True, index=True)
    
    # Relationships
    manager = relationship("User")
    opportunities = relationship("Opportunity", back_populates="territory")
    accounts = relationship("Account", back_populates="territory")
    
    def __repr__(self) -> str:
        return f"<Territory(id={self.id}, name='{self.name}', region='{self.region}')>"