from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.db.session import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    groups_created = relationship("Group", back_populates="creator")
    memberships = relationship("GroupMember", back_populates="user")
    expenses_paid = relationship("Expense", back_populates="payer")
    splits_owed = relationship("ExpenseSplit", back_populates="user")
    settlements_made = relationship("Settlement", foreign_keys="[Settlement.paid_by]", back_populates="payer")
    settlements_received = relationship("Settlement", foreign_keys="[Settlement.paid_to]", back_populates="payee")