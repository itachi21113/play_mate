import time

from fastapi import HTTPException
from sqlalchemy import func
from sqlmodel import Session, select

from backend.models import Tournament, TournamentRegistration, User
from backend.repositories import tournament_repo


def tournament_to_dict(tournament: Tournament, session: Session) -> dict:
    count = session.exec(
        select(func.count()).select_from(TournamentRegistration).where(
            TournamentRegistration.tournament_id == tournament.id
        )
    ).one()
    return {
        "id": tournament.id, "name": tournament.name, "game": tournament.game,
        "date": tournament.date, "time": tournament.time, "fee": tournament.fee,
        "prize": tournament.prize, "max": tournament.max_slots,
        "taken": tournament.base_taken + count, "unit": tournament.unit,
        "status": tournament.status, "host": tournament.host,
        "hostUsername": tournament.host_username, "desc": tournament.desc,
    }


def list_tournaments_with_counts(session: Session) -> list[dict]:
    return [tournament_to_dict(item, session) for item in tournament_repo.get_all_tournaments(session)]


def create_new_tournament(session: Session, body, current_user: User) -> dict:
    values = body.model_dump(by_alias=False)
    tournament = Tournament(
        id=f"c{time.time_ns()}", name=values["name"], game=values["game"],
        date=values["date"], time=values["time"], fee=values["fee"],
        prize=values["prize"], max_slots=values["max_slots"], base_taken=0,
        unit=values["unit"], status="upcoming",
        host=values["host"] or current_user.full_name,
        host_username=current_user.username, desc=values["description"],
    )
    tournament_repo.create_tournament(session, tournament)
    return tournament_to_dict(tournament, session)


def register_user_for_tournament(session: Session, tournament_id: str, current_user: User) -> dict:
    tournament = tournament_repo.get_by_id(session, tournament_id)
    if tournament is None:
        return {"ok": False, "message": "Tournament not found."}
    if tournament.status != "upcoming":
        return {"ok": False, "message": "Registration is closed for this tournament."}
    if tournament_repo.is_user_registered(session, tournament_id, current_user.username):
        return {"ok": False, "message": "You are already registered for this tournament."}
    registrations = tournament_repo.get_tournament_registrations(session, tournament_id)
    if tournament.base_taken + len(registrations) >= tournament.max_slots:
        return {"ok": False, "message": "Sorry, all slots are filled."}
    tournament_repo.create_registration(session, tournament_id, current_user.username)
    return {
        "ok": True,
        "message": f"You're registered for {tournament.name}! See you in the lobby.",
    }


def change_tournament_status(session: Session, tournament_id: str, new_status: str, current_user: User) -> dict:
    tournament = tournament_repo.get_by_id(session, tournament_id)
    if tournament is None:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if current_user.role != "admin" and tournament.host_username != current_user.username:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if new_status not in {"upcoming", "ongoing", "completed"}:
        raise HTTPException(status_code=422, detail="Invalid tournament status")
    tournament_repo.update_status(session, tournament, new_status)
    return tournament_to_dict(tournament, session)
