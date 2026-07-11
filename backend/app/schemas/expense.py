from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.expense import SplitType
from app.schemas.user import UserRead

class SplitInput(BaseModel):
    user_id: int
    value: Decimal | None = None
    
class ExpenseCreate(BaseModel):
    description: str
    amount: Decimal
    paid_by: int
    split_type: SplitType
    splits: list[SplitInput]
    
    @field_validator("amount")
    @classmethod
    def positive_check(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("The amount must be positive")
        return value

class ExpenseSplitRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user: UserRead
    amount_owed: Decimal
    
class ExpenseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    group_id: int
    description: str
    amount: Decimal
    paid_by: int
    split_type: SplitType
    created_at: datetime
    splits: list[ExpenseSplitRead]