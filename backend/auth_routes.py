"""
Authentication routes for user registration, login, and management
"""
from datetime import timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from database import get_db
from models import User, UserRole
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_active_user,
    require_role
)
from config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Pydantic models for requests/responses
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8)
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    role: str
    specialization: Optional[str]
    hospital_affiliation: Optional[str]
    is_active: bool
    is_verified: bool
    created_at: str

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    email: Optional[EmailStr] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user (doctor)

    Creates a new user account with the provided information.
    The default role is 'doctor'.
    """
    # Check if user already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=UserRole.DOCTOR,  # Default role
        specialization=user_data.specialization,
        license_number=user_data.license_number,
        hospital_affiliation=user_data.hospital_affiliation,
        is_active=True,
        is_verified=False  # Require email verification in production
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username, "user_id": db_user.id},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=db_user.id,
            email=db_user.email,
            username=db_user.username,
            full_name=db_user.full_name,
            role=db_user.role.value,
            specialization=db_user.specialization,
            hospital_affiliation=db_user.hospital_affiliation,
            is_active=db_user.is_active,
            is_verified=db_user.is_verified,
            created_at=db_user.created_at.isoformat()
        )
    }

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login with username and password

    Returns a JWT access token upon successful authentication.
    """
    # Find user by username or email
    user = db.query(User).filter(
        (User.username == form_data.username) | (User.email == form_data.username)
    ).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            role=user.role.value,
            specialization=user.specialization,
            hospital_affiliation=user.hospital_affiliation,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at.isoformat()
        )
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current user information

    Returns the profile information of the currently authenticated user.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role.value,
        specialization=current_user.specialization,
        hospital_affiliation=current_user.hospital_affiliation,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at.isoformat()
    )

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user profile

    Allows the authenticated user to update their profile information.
    """
    # Update fields if provided
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.specialization is not None:
        current_user.specialization = user_update.specialization
    if user_update.license_number is not None:
        current_user.license_number = user_update.license_number
    if user_update.hospital_affiliation is not None:
        current_user.hospital_affiliation = user_update.hospital_affiliation
    if user_update.email is not None:
        # Check if email is already taken
        existing_user = db.query(User).filter(
            User.email == user_update.email,
            User.id != current_user.id
        ).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = user_update.email
        current_user.is_verified = False  # Require re-verification

    db.commit()
    db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role.value,
        specialization=current_user.specialization,
        hospital_affiliation=current_user.hospital_affiliation,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at.isoformat()
    )

@router.post("/change-password")
async def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change user password

    Allows the authenticated user to change their password.
    """
    # Verify current password
    if not verify_password(password_change.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_change.new_password)
    db.commit()

    return {"message": "Password changed successfully"}

@router.get("/users", response_model=list[UserResponse])
async def list_users(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    List all users (Admin only)

    Returns a list of all registered users. Requires admin privileges.
    """
    users = db.query(User).all()
    return [
        UserResponse(
            id=user.id,
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            role=user.role.value,
            specialization=user.specialization,
            hospital_affiliation=user.hospital_affiliation,
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at.isoformat()
        )
        for user in users
    ]
