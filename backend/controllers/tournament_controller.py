from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from backend.core.database import get_session
from backend.core.security import get_current_user, require_role
from backend.models import User
from backend.repositories import tournament_repo, user_repo
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
OrganizerUser = Annotated[User, Depends(require_role("organizer"))]
OrganizerOrAdmin = Annotated[
    User, Depends(require_role("organizer", "admin"))
]


@router.get("/api/tournaments")
def list_tournaments(session: SessionDependency) -> list[dict]:
    return list_tournaments_with_counts(session)


@router.post("/api/tournaments")
def create_tournament(
    body: CreateTournamentRequest,
    session: SessionDependency,
    current_user: OrganizerUser,
) -> dict:
    return create_new_tournament(session, body, current_user)


@router.post("/api/tournaments/{tournament_id}/register")
def register_for_tournament(
    tournament_id: str, session: SessionDependency, current_user: CurrentUser
) -> dict:
    return register_user_for_tournament(session, tournament_id, current_user)


@router.get("/api/tournaments/{tournament_id}/participants")
def tournament_participants(
    tournament_id: str,
    session: SessionDependency,
    current_user: OrganizerOrAdmin,
) -> list[dict]:
    tournament = tournament_repo.get_by_id(session, tournament_id)
    if tournament is None:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if (
        current_user.role == "organizer"
        and tournament.host_username != current_user.username
    ):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    participants = []
    for registration in tournament_repo.get_tournament_registrations(
        session, tournament_id
    ):
        player = user_repo.get_by_username(session, registration.username)
        if player is not None and player.role == "player":
            participants.append({
                "username": player.username,
                "fullName": player.full_name,
                "email": player.email,
                "phone": player.phone,
                "favGame": player.fav_game,
                "avatar": player.avatar,
            })
    return participants


@router.patch("/api/tournaments/{tournament_id}/status")
def update_tournament_status(
    tournament_id: str,
    body: UpdateTournamentStatusRequest,
    session: SessionDependency,
    current_user: OrganizerOrAdmin,
) -> dict:
    return change_tournament_status(
        session, tournament_id, body.status, current_user
    )
