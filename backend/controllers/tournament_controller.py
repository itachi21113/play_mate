from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from backend.core.database import get_session
from backend.core.security import get_current_user
from backend.models import User
from backend.schemas.tournament import (
    CreateTournamentRequest,
    UpdateTournamentStatusRequest,
)
from backend.services.tournament_service import (
    change_tournament_status,
    create_new_tournament,
    list_tournaments_with_counts,
    register_user_for_tournament,
)

router = APIRouter()
SessionDependency = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("/api/tournaments")
def list_tournaments(session: SessionDependency) -> list[dict]:
    return list_tournaments_with_counts(session)


@router.post("/api/tournaments")
def create_tournament(
    body: CreateTournamentRequest,
    session: SessionDependency,
    current_user: CurrentUser,
) -> dict:
    return create_new_tournament(session, body, current_user)


@router.post("/api/tournaments/{tournament_id}/register")
def register_for_tournament(
    tournament_id: str, session: SessionDependency, current_user: CurrentUser
) -> dict:
    return register_user_for_tournament(session, tournament_id, current_user)


@router.patch("/api/tournaments/{tournament_id}/status")
def update_tournament_status(
    tournament_id: str,
    body: UpdateTournamentStatusRequest,
    session: SessionDependency,
    current_user: CurrentUser,
) -> dict:
    return change_tournament_status(
        session, tournament_id, body.status, current_user
    )
