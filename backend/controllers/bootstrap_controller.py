from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlmodel import Session

from backend.core.database import get_session
from backend.repositories import tournament_repo, user_repo
from backend.services.auth_service import user_to_dict, user_to_player_dict
from backend.services.tournament_service import tournament_to_dict

router = APIRouter()
SessionDependency = Annotated[Session, Depends(get_session)]


@router.get("/api/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@router.get("/api/bootstrap")
def bootstrap(session: SessionDependency) -> dict[str, Any]:
    users = user_repo.get_all_users(session)
    registrations = {}
    for registration in tournament_repo.get_all_registrations(session):
        registrations.setdefault(registration.username, []).append(registration.tournament_id)
    return {
        "users": [user_to_dict(user) for user in users],
        "players": [user_to_player_dict(user) for user in users],
        "tournaments": [
            tournament_to_dict(tournament, session)
            for tournament in tournament_repo.get_all_tournaments(session)
        ],
        "registrations": registrations,
    }
