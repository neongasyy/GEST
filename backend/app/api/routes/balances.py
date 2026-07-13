from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.balance import GroupBalances
from app.services.balances import calculate_net_balances, simplify_debts
from app.services.groups import get_group_with_members, require_membership

router = APIRouter(prefix = "/groups", tags = ["balances"])

@router.get("/{group_id}/balances", response_model = GroupBalances)
def get_group_balances(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = get_group_with_members(db, group_id)
    require_membership(group, current_user.id) # type: ignore[arg-type]
    
    member_ids = [member.user_id for member in group.members]
    users_by_id = {member.user_id: member.user for member in group.members}
    
    net_balances = calculate_net_balances(db, group_id, member_ids)
    
    balances = [
        {"user": users_by_id[user_id], "net_balance": balance} for user_id, balance in net_balances.items()
    ]
    
    suggested_settlements = [
        {"from_user": users_by_id[debtor_id], "to_user": users_by_id[creditor_id], "amount": amount} for debtor_id, creditor_id, amount in simplify_debts(net_balances)
    ]
    
    return {"balances": balances, "suggested_settlements": suggested_settlements}