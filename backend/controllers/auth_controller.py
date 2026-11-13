from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from backend.core.database import get_session
from backend.core.security import get_current_user
from backend.models import User
from backend.schemas.auth import LoginRequest, RegisterRequest, UpdateProfileRequest
from backend.services.auth_service import (
    authenticate_user,
    register_user,
    update_user_profile,
)

router = APIRouter()
SessionDependency = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("/api/auth/register")
def register(body: RegisterRequest, session: SessionDependency) -> dict:
    return register_user(session, body)


@router.post("/api/auth/login")
def login(body: LoginRequest, session: SessionDependency) -> dict:
    return authenticate_user(session, body)


@router.put("/api/users/me")
def update_user(
    body: UpdateProfileRequest, session: SessionDependency, current_user: CurrentUser
) -> dict:
    return update_user_profile(session, current_user, body)
