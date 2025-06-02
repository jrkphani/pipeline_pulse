"""
Currency Rate Model

Database model for caching exchange rates from external APIs.
Stores currency conversion rates with timestamps for cache management.
"""

from sqlalchemy import Column, String, Float, DateTime, Index
from sqlalchemy.sql import func
from app.core.database import Base

class CurrencyRate(Base):
    """Model for storing cached currency exchange rates"""
    
    __tablename__ = "currency_rates"
    
    # Primary key is the currency code
    currency_code = Column(String(3), primary_key=True, index=True)
    
    # Exchange rate: 1 SGD = sgd_rate units of this currency
    sgd_rate = Column(Float, nullable=False)
    
    # Timestamp for cache management
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Index for efficient queries by update time
    __table_args__ = (
        Index('idx_currency_updated', 'updated_at'),
    )
    
    def __repr__(self):
        return f"<CurrencyRate(currency_code='{self.currency_code}', sgd_rate={self.sgd_rate}, updated_at='{self.updated_at}')>"
    
    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'currency_code': self.currency_code,
            'sgd_rate': self.sgd_rate,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
