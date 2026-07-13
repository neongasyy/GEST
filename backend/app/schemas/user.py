from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    
    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()
    
class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: EmailStr
    name: str
    created_at: datetime
    
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"