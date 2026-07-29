from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_reset_token,
    hash_password,
    hash_reset_token,
    verify_password,
)
from app.db.session import get_db
from app.models.reset_password import PasswordResetToken
from app.models.user import User
from app.schemas.user import ForgotPasswordRequest, ResetPasswordRequest, Token, UserCreate, UserRead
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    user = User(
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        name=user_in.name
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower()).first()
    if not user or not verify_password(form_data.password, user.hashed_password): # type: ignore[arg-type]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)

@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if user:
        raw_token = generate_reset_token()
        reset_token = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_reset_token(raw_token),
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=30),
        )
        db.add(reset_token)
        db.commit()

        reset_link = f"{settings.frontend_url}/reset-password?token={raw_token}"
        print(f"[DEV] Password reset link for {user.email}: {reset_link}")

    return {"message": "If that email exists, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    token_hash = hash_reset_token(payload.token)
    reset_token = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == token_hash).first()

    if (
        not reset_token
        or reset_token.used  # type: ignore[truthy-function]
        or reset_token.expires_at < datetime.now(timezone.utc)  # type: ignore[operator]
    ):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")

    user = db.query(User).filter(User.id == reset_token.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset link")

    user.hashed_password = hash_password(payload.new_password)  # type: ignore[assignment]
    reset_token.used = True  # type: ignore[assignment]
    db.commit()

    return {"message": "Password has been reset successfully."}