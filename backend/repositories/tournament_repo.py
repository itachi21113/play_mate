from sqlmodel import Session, select

from backend.models import Tournament, TournamentRegistration


def get_all_tournaments(session: Session) -> list[Tournament]:
    return list(session.exec(select(Tournament).order_by(Tournament.id)).all())


def get_by_id(session: Session, tournament_id: str) -> Tournament | None:
    return session.get(Tournament, tournament_id)


def get_all_registrations(session: Session) -> list[TournamentRegistration]:
    return list(session.exec(select(TournamentRegistration)).all())


def get_tournament_registrations(
    session: Session, tournament_id: str
) -> list[TournamentRegistration]:
    return list(
        session.exec(
            select(TournamentRegistration).where(
                TournamentRegistration.tournament_id == tournament_id
            )
        ).all()
    )


def is_user_registered(session: Session, tournament_id: str, username: str) -> bool:
    return session.exec(
        select(TournamentRegistration).where(
            TournamentRegistration.tournament_id == tournament_id,
            TournamentRegistration.username == username,
        )
    ).first() is not None


def create_tournament(session: Session, tournament: Tournament) -> Tournament:
    session.add(tournament)
    session.commit()
    session.refresh(tournament)
    return tournament


def create_registration(
    session: Session, tournament_id: str, username: str
) -> TournamentRegistration:
    registration = TournamentRegistration(
        tournament_id=tournament_id, username=username
    )
    session.add(registration)
    session.commit()
    session.refresh(registration)
    return registration


def update_status(session: Session, tournament: Tournament, status: str) -> Tournament:
    tournament.status = status
    session.add(tournament)
    session.commit()
    session.refresh(tournament)
    return tournament
