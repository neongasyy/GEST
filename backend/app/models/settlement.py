from sqlalchemy import Column, Integer, Numeric, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import relationship

from app.db.session import Base

class Settlement(Base):
    __tablename__ = "settlements"
    __table_args__ = (CheckConstraint("paid_by != paid_to", name="check_paid_by_not_equal_paid_to"),)
    
    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    paid_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    paid_to = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    group = relationship("Group", back_populates="settlements")
    payer = relationship("User", foreign_keys=[paid_by], back_populates="settlements_made")
    payee = relationship("User", foreign_keys=[paid_to], back_populates="settlements_received")