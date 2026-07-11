from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.group import Group, GroupMember
from app.models.user import User
from app.schemas.group import GroupCreate, GroupRead, GroupDetail, AddMemberRequest
from app.services.groups import get_group_with_members, require_membership

router = APIRouter(prefix="/groups", tags=["groups"])

@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(group_in: GroupCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = Group(name=group_in.name, created_by=current_user.id)
    db.add(group)
    db.flush()

    membership = GroupMember(group_id=group.id, user_id=current_user.id)
    db.add(membership)
    db.commit()
    db.refresh(group)
    return group

@router.get("", response_model=list[GroupRead])
def list_my_groups(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    groups = (db.query(Group).join(GroupMember, Group.id == GroupMember.group_id).filter(GroupMember.user_id == current_user.id).all())
    return groups

@router.get("/{group_id}", response_model=GroupDetail)
def get_group(group_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = get_group_with_members(db, group_id)
    require_membership(group, current_user.id) #type: ignore[arg-type]
    return group

@router.post("/{group_id}/members", response_model=GroupDetail, status_code=status.HTTP_201_CREATED)
def add_member(group_id: int, payload: AddMemberRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = get_group_with_members(db, group_id)
    require_membership(group, current_user.id) #type: ignore[arg-type]

    target_user = db.query(User).filter(User.email == payload.email).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with that email does not exist",
        )
    
    if any(member.user_id == target_user.id for member in group.members):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of the group",
        )
        
    membership = GroupMember(group_id=group.id, user_id=target_user.id)
    db.add(membership)
    db.commit()
    
    return get_group_with_members(db, group_id)

@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(group_id: int, user_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    group = get_group_with_members(db, group_id)
    require_membership(group, current_user.id) #type: ignore[arg-type]

    if user_id != current_user.id and current_user.id != group.created_by: # type: ignore[operator]
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to remove this member",
        )
        
    membership = next((member for member in group.members if member.user_id == user_id), None)
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of the group",
        )
    
    db.delete(membership)
    db.commit()