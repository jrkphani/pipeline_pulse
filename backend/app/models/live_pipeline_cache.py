"""
Live Pipeline Cache Model
Caches pipeline data for real-time updates and performance
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, Float, Text, JSON, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import uuid
import enum


class CacheStatus(str, enum.Enum):
    """Cache entry status"""
    FRESH = "fresh"
    STALE = "stale"
    UPDATING = "updating"
    ERROR = "error"


class LivePipelineCache(Base):
    """Cache for live pipeline data"""
    __tablename__ = 'live_pipeline_cache'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cache_key = Column(String(255), unique=True, nullable=False)  # Unique identifier for cache entry
    module_name = Column(String(50), nullable=False)
    record_type = Column(String(50))  # Type of data cached (deals, contacts, etc.)
    
    # Cache data
    data = Column(JSON, nullable=False)  # The cached data
    cache_metadata = Column(JSON)  # Additional metadata about the cache
    
    # Cache management
    status = Column(Enum(CacheStatus), default=CacheStatus.FRESH)
    ttl_seconds = Column(Integer, default=300)  # Time to live (5 minutes default)
    hit_count = Column(Integer, default=0)  # Number of times accessed
    
    # Timestamps
    cached_at = Column(DateTime, default=func.now())
    expires_at = Column(DateTime, nullable=False)
    last_accessed = Column(DateTime, default=func.now())
    last_updated = Column(DateTime, default=func.now())
    
    # Performance metrics
    generation_time_ms = Column(Integer)  # Time taken to generate cache
    size_bytes = Column(Integer)  # Size of cached data
    
    # Related data
    source_record_ids = Column(JSON)  # IDs of source records
    dependent_caches = Column(JSON)  # Other cache keys that depend on this
    
    # Invalidation
    invalidation_reason = Column(String(255))
    invalidated_by = Column(String(100))
    invalidated_at = Column(DateTime)