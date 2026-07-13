from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.user import UserRead

class GroupCreate(BaseModel):
    name: str
    
    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Name cannot be blank")
        return value
    
class GroupRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    created_by: int
    created_at: datetime
    
class GroupMemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user: UserRead
    joined_at: datetime
    
class GroupDetail(GroupRead):
    members: list[GroupMemberRead]
    
class AddMemberRequest(BaseModel):
    email:str
    
    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()