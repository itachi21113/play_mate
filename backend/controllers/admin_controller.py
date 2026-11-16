from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from backend.core.database import get_session
from backend.core.security import require_role
from backend.models import User
from backend.schemas.auth import ApprovalRequest
from backend.services.admin_service import (
    delete_tournament,
    list_users,
    update_user_approval,
)

router = APIRouter()
SessionDependency = Annotated[Session, Depends(get_session)]
AdminUser = Annotated[User, Depends(require_role("admin"))]


@router.get("/api/admin/users")
def admin_users(session: SessionDependency, _: AdminUser) -> list[dict]:
    return list_users(session)


@router.patch("/api/admin/users/{username}/approval")
def approve_user(
    username: str,
    body: ApprovalRequest,
    session: SessionDependency,
    _: AdminUser,
) -> dict:
    return update_user_approval(session, username, body.status)


@router.delete("/api/admin/tournaments/{tournament_id}")
def remove_tournament(
    tournament_id: str,
    session: SessionDependency,
    _: AdminUser,
) -> dict[str, bool]:
    return delete_tournament(session, tournament_id)
