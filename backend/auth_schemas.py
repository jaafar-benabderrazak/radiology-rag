from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from models import UserRole

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str
    role: UserRole = UserRole.DOCTOR
    hospital_name: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    hospital_name: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Authentication schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
