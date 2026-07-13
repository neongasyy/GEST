from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.schemas.user import UserRead

class UserBalance(BaseModel):
    model_config = ConfigDict(from_attributes = True)
    
    user: UserRead
    net_balance: Decimal
    
class SettlementSuggestion(BaseModel):
    from_user: UserRead
    to_user: UserRead
    amount: Decimal

class GroupBalances(BaseModel):
    balances: list[UserBalance]
    suggested_settlements: list[SettlementSuggestion]