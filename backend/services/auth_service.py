import json

from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from backend.core.security import create_access_token, hash_password, verify_password
from backend.models import Message, TournamentRegistration, User
from backend.repositories import user_repo
from backend.schemas.auth import clean_phone


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id, "fullName": user.full_name, "username": user.username,
        "email": user.email, "phone": user.phone, "bio": user.bio,
        "favGame": user.fav_game, "avatar": user.avatar,
        "games": json.loads(user.games_json), "online": user.online,
        "last": user.last_seen, "reply": user.reply_hint, "role": user.role,
    }


def user_to_player_dict(user: User) -> dict:
    return {
        "id": user.username, "name": user.full_name, "game": user.fav_game,
        "games": json.loads(user.games_json), "online": user.online,
        "img": user.avatar, "last": user.last_seen, "bio": user.bio,
        "reply": user.reply_hint,
    }


def register_user(session: Session, body) -> dict:
    username, email, phone = body.username.strip(), body.email.strip(), clean_phone(body.phone)
    errors = {}
    if user_repo.get_by_username(session, username):
        errors["username"] = "That username is already taken."
    if user_repo.get_by_email(session, email):
        errors["email"] = "An account with this email already exists."
    if user_repo.get_by_phone(session, phone):
        errors["phone"] = "This phone number is already registered."
    if errors:
        return {"ok": False, "errors": errors}
    user = User(
        full_name=body.full_name.strip(), username=username, email=email,
        phone=phone, password_hash=hash_password(body.password),
    )
    try:
        user_repo.create_user(session, user)
    except IntegrityError:
        session.rollback()
        return {"ok": False, "errors": {"username": "Account details already exist."}}
    return {"ok": True, "token": create_access_token(user.username), "user": user_to_dict(user)}


def authenticate_user(session: Session, body) -> dict:
    user = user_repo.get_by_ident(session, body.ident)
    if user is None:
        return {"ok": False, "error": "No account found. Please register first."}
    if not verify_password(body.password, user.password_hash):
        return {"ok": False, "error": "Incorrect password. Try again."}
    return {"ok": True, "token": create_access_token(user.username), "user": user_to_dict(user)}


def update_user_profile(session: Session, user: User, body) -> dict:
    values = body.model_dump(exclude_unset=True)
    old_username = user.username
    requested_username = values.get("username", old_username)
    if isinstance(requested_username, str):
        requested_username = requested_username.strip()
    errors = {}
    for field in ("username", "email", "phone"):
        value = values.get(field)
        if value is None:
            continue
        if field == "phone":
            value = clean_phone(value)
            values[field] = value
        duplicate = (
            user_repo.get_by_username(session, value.strip())
            if field == "username"
            else user_repo.get_by_email(session, value.strip())
            if field == "email"
            else user_repo.get_by_phone(session, value)
        )
        if duplicate is not None and duplicate.id != user.id:
            errors[field] = f"Another account uses this {field}."
    if errors:
        return {"ok": False, "errors": errors}
    field_map = {"full_name": "full_name", "fav_game": "fav_game"}
    normalized = {
        field_map.get(key, key): value.strip() if isinstance(value, str) else value
        for key, value in values.items()
    }
    if requested_username != old_username:
        for registration in session.exec(
            select(TournamentRegistration).where(TournamentRegistration.username == old_username)
        ).all():
            registration.username = requested_username
        for message in session.exec(
            select(Message).where(
                or_(Message.sender_username == old_username, Message.receiver_username == old_username)
            )
        ).all():
            if message.sender_username == old_username:
                message.sender_username = requested_username
            if message.receiver_username == old_username:
                message.receiver_username = requested_username
    try:
        user_repo.update_user(session, user, normalized)
    except IntegrityError:
        session.rollback()
        return {"ok": False, "errors": {"username": "Account details already exist."}}
    return {
        "ok": True, "token": create_access_token(user.username),
        "user": user_to_dict(user),
    }
