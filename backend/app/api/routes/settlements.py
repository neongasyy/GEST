from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.settlement import Settlement
from app.models.user import User
from app.schemas.settlement import SettlementCreate, SettlementRead
from app.services.groups import get_group_with_members, require_membership

router = APIRouter(prefix = "/groups", tags = ["settlements"])

def _get_settlement_with_users(db: Session, settlement_id: int) -> Settlement:
    settlement = (db.query(Settlement).options(joinedload(Settlement.payer), joinedload(Settlement.payee)).filter(Settlement.id == settlement_id).first())
    if not settlement:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND, detail = "Settlement not found")
    return settlement

@router.post("/{group_id}/settlements", response_model = SettlementRead, status_code = status.HTTP_201_CREATED)
def create_settlement(group_id: int, settlement_in: SettlementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = get_group_with_members(db, group_id)
    require_membership(group, current_user.id) # type: ignore[arg-type]
    
    member_ids = {member.user_id for member in group.members}
    if settlement_in.paid_by not in member_ids or settlement_in.paid_to not in member_ids:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, detail = "Both users must be group members")
    if settlement_in.paid_by == settlement_in.paid_to:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST, detail = "Payer and Payee must be different users")
    
    settlement = Settlement(group_id = group_id, paid_by = settlement_in.paid_by, paid_to = settlement_in.paid_to, amount = settlement_in.amount)
    db.add(settlement)
    db.commit()
    
    return _get_settlement_with_users(db, settlement.id) # type: ignore[arg-type]

@router.get("/{group_id}/settlements", response_model = list[SettlementRead])
def list_settlements(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = get_group_with_members(db, group_id)
    require_membership(group, current_user.id) # type: ignore[arg-type]
    
    settlements = (db.query(Settlement).options(joinedload(Settlement.payer), joinedload(Settlement.payee)).filter(Settlement.group_id == group_id).order_by(Settlement.created_at.desc()).all())
    return settlements