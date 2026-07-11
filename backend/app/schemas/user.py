from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    
class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    email: EmailStr
    name: str
    created_at: datetime
    
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"