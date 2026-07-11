import enum

from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.session import Base

class SplitType(str, enum.Enum):
    EQUAL = "equal"
    PERCENTAGE = "percentage"
    EXACT = "exact"
    
class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    paid_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    split_type = Column(Enum(SplitType, values_callable=lambda enum_cls: [e.value for e in enum_cls]), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("Group", back_populates="expenses")
    payer = relationship("User", back_populates="expenses_paid")
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")

class ExpenseSplit(Base):
    __tablename__ = "expense_splits"
    __table_args__ = (UniqueConstraint('expense_id', 'user_id', name='unique_expense_split'),)
    
    id = Column(Integer, primary_key=True)
    expense_id = Column(Integer, ForeignKey("expenses.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount_owed = Column(Numeric(10, 2), nullable=False)
    
    expense = relationship("Expense", back_populates="splits")
    user = relationship("User", back_populates="splits_owed")