from fastapi import HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.models.group import Group, GroupMember

def get_group_with_members(db: Session, group_id: int) -> Group:
    group = (db.query(Group)).options(joinedload(Group.members).joinedload(GroupMember.user)).filter(Group.id==group_id).first()
    
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return group

def require_membership(group: Group, user_id: int) -> None:
    if not any(member.user_id == user_id for member in group.members):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a member of this group")