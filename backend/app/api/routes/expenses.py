from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.expense import Expense, ExpenseSplit
from app.models.user import User
from app.schemas.expense import ExpenseCreate, ExpenseRead
from app.services.groups import get_group_with_members, require_membership
from app.services.splits import calculate_splits

router = APIRouter(prefix="/groups", tags=["expenses"])

def _get_expense_with_splits(db: Session, expense_id: int) -> Expense:
    expense = (db.query(Expense).options(joinedload(Expense.splits).joinedload(ExpenseSplit.user)).filter(Expense.id == expense_id).first())
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense

@router.post("/{group_id}/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
def create_expense(group_id: int, expense_in: ExpenseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = get_group_with_members(db, group_id)
    require_membership(group, current_user.id) # type: ignore[arg-type]
    
    member_ids = {member.user_id for member in group.members}
    if expense_in.paid_by not in member_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The payer must be a group member")
    
    split_user_ids = {split.user_id for split in expense_in.splits}
    if not split_user_ids.issubset(member_ids):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All participants must be group members")
    
    try:
        shares = calculate_splits(expense_in.split_type, expense_in.amount, expense_in.splits)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    
    expense = Expense(
        group_id = group_id,
        description = expense_in.description,
        amount = expense_in.amount,
        paid_by = expense_in.paid_by,
        split_type = expense_in.split_type
    )
    db.add(expense)
    db.flush()
    
    for user_id, amount_owed in shares.items():
        db.add(ExpenseSplit(expense_id = expense.id, user_id = user_id, amount_owed = amount_owed))
        
    db.commit()
    
    return _get_expense_with_splits(db, expense.id) # type: ignore[arg-type]

@router.get("/{group_id}/expenses", response_model=list[ExpenseRead])
def list_expenses(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = get_group_with_members(db, group_id)
    require_membership(group, current_user.id) # type: ignore[arg-type]
    
    expenses = (db.query(Expense).options(joinedload(Expense.splits).joinedload(ExpenseSplit.user)).filter(Expense.group_id == group_id).order_by(Expense.created_at.desc()).all())
    return expenses