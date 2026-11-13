from sqlalchemy import func, or_
from sqlmodel import Session, select

from backend.models import User


def get_all_users(session: Session) -> list[User]:
    return list(session.exec(select(User).order_by(User.id)).all())


def get_by_username(session: Session, username: str) -> User | None:
    return session.exec(
        select(User).where(func.lower(User.username) == username.strip().lower())
    ).first()


def get_by_email(session: Session, email: str) -> User | None:
    return session.exec(
        select(User).where(func.lower(User.email) == email.strip().lower())
    ).first()


def get_by_phone(session: Session, phone: str) -> User | None:
    return session.exec(select(User).where(User.phone == phone)).first()


def get_by_ident(session: Session, ident: str) -> User | None:
    ident = ident.strip().lower()
    return session.exec(
        select(User).where(
            or_(func.lower(User.username) == ident, func.lower(User.email) == ident)
        )
    ).first()


def create_user(session: Session, user: User) -> User:
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def update_user(session: Session, user: User, values: dict) -> User:
    for key, value in values.items():
        setattr(user, key, value)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
