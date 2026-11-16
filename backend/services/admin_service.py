from fastapi import HTTPException
from sqlmodel import Session

from backend.repositories import tournament_repo, user_repo
from backend.services.auth_service import user_to_dict


def list_users(session: Session) -> list[dict]:
    return [user_to_dict(user) for user in user_repo.get_all_users(session)]


def update_user_approval(
    session: Session, username: str, approval_status: str
) -> dict:
    user = user_repo.get_by_username(session, username)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    user.approval_status = approval_status
    user_repo.save_user(session, user)
    return {"ok": True, "user": user_to_dict(user)}


def delete_tournament(session: Session, tournament_id: str) -> dict[str, bool]:
    tournament = tournament_repo.get_by_id(session, tournament_id)
    if tournament is None:
        raise HTTPException(status_code=404, detail="Tournament not found")
    tournament_repo.delete_tournament(session, tournament)
    return {"ok": True}
