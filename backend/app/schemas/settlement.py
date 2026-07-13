from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.user import UserRead

class SettlementCreate(BaseModel):
    paid_by: int
    paid_to: int
    amount: Decimal
    
    @field_validator("amount")
    @classmethod
    def positive_check(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("Amount must be positive")
        return value

class SettlementRead(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    
    id: int
    payer: UserRead
    payee: UserRead
    amount: Decimal
    created_at: datetime