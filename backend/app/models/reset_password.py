from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, func

from app.db.session import Base

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"
    
    id = Column(Integer, primary_key = True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable = False)
    token_hash = Column(String, nullable = False, unique = True, index = True)
    expires_at = Column(DateTime(timezone = True), nullable = False)
    used = Column(Boolean, default = False, nullable = False)
    created_at = Column(DateTime(timezone = True), server_default = func.now())