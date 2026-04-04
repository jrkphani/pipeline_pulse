import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    cro = "cro"
    sales_manager = "sales_manager"
    presales_manager = "presales_manager"
    ae = "ae"
    sdr = "sdr"
    presales_consultant = "presales_consultant"
    presales_sa = "presales_sa"
    aws_alliance_manager = "aws_alliance_manager"
    finance_manager = "finance_manager"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.ae)
    is_active = Column(Boolean, default=True, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    owned_opportunities = relationship("Opportunity", foreign_keys="Opportunity.owner_id", back_populates="owner")
    custodian_opportunities = relationship("Opportunity", foreign_keys="Opportunity.custodian_id", back_populates="custodian")
    owned_leads = relationship("Lead", back_populates="owner")
    notifications = relationship("Notification", back_populates="user")

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self) -> str:
        return f"<User id={self.id} email={self.email!r} role={self.role}>"
