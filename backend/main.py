import json
import time
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field as PydanticField
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from backend.auth import (
    create_access_token,
    decode_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from backend.database import init_db_and_seed
from backend.database import get_session as session_dependency
from backend.models import Message, Tournament, TournamentRegistration, User
from backend.ws_manager import manager

SessionDependency = Annotated[Session, Depends(session_dependency)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db_and_seed()
    yield


app = FastAPI(lifespan=lifespan)


class RegisterBody(BaseModel):
    full_name: str = PydanticField(alias="fullName", min_length=2)
    username: str = PydanticField(min_length=3, max_length=20)
    email: str
    phone: str
    password: str = PydanticField(min_length=8)


class LoginBody(BaseModel):
    ident: str
    password: str


class UpdateUserBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    full_name: str | None = PydanticField(default=None, alias="fullName")
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    bio: str | None = None
    fav_game: str | None = PydanticField(default=None, alias="favGame")
    avatar: str | None = None


class TournamentBody(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    game: str
    date: str
    time: str
    fee: int = 0
    prize: int = 0
    max_slots: int = PydanticField(alias="max", gt=0)
    unit: str = "players"
    host: str | None = None
    host_username: str | None = PydanticField(default=None, alias="hostUsername")
    description: str = PydanticField(alias="desc")


class StatusBody(BaseModel):
    status: str


class SendMessageBody(BaseModel):
    receiver_username: str = PydanticField(alias="receiverUsername")
    text: str
    is_file: bool = PydanticField(default=False, alias="isFile")


def public_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "fullName": user.full_name,
        "username": user.username,
        "email": user.email,
        "phone": user.phone,
        "bio": user.bio,
        "favGame": user.fav_game,
        "avatar": user.avatar,
        "games": json.loads(user.games_json),
        "online": user.online,
        "last": user.last_seen,
        "reply": user.reply_hint,
        "role": user.role,
    }


def public_player(user: User) -> dict[str, Any]:
    return {
        "id": user.username,
        "name": user.full_name,
        "game": user.fav_game,
        "games": json.loads(user.games_json),
        "online": user.online,
        "img": user.avatar,
        "last": user.last_seen,
        "bio": user.bio,
        "reply": user.reply_hint,
    }


def public_tournament(tournament: Tournament, session: Session) -> dict[str, Any]:
    registration_count = session.exec(
        select(func.count()).select_from(TournamentRegistration).where(
            TournamentRegistration.tournament_id == tournament.id
        )
    ).one()
    return {
        "id": tournament.id,
        "name": tournament.name,
        "game": tournament.game,
        "date": tournament.date,
        "time": tournament.time,
        "fee": tournament.fee,
        "prize": tournament.prize,
        "max": tournament.max_slots,
        "taken": tournament.base_taken + registration_count,
        "unit": tournament.unit,
        "status": tournament.status,
        "host": tournament.host,
        "hostUsername": tournament.host_username,
        "desc": tournament.desc,
    }


def public_message(message: Message, current_username: str) -> dict[str, Any]:
    return {
        "id": message.id,
        "senderUsername": message.sender_username,
        "receiverUsername": message.receiver_username,
        "from": "me" if message.sender_username == current_username else "them",
        "text": message.text,
        "time": message.time_label,
        "status": message.status,
        "isFile": message.is_file,
        "createdAt": message.created_at.isoformat(),
    }


@app.get("/api/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/api/bootstrap")
def bootstrap(session: SessionDependency) -> dict[str, Any]:
    users = session.exec(select(User).order_by(User.id)).all()
    tournaments = session.exec(select(Tournament).order_by(Tournament.id)).all()
    registrations = session.exec(select(TournamentRegistration)).all()
    registration_map: dict[str, list[str]] = {}
    for registration in registrations:
        registration_map.setdefault(registration.username, []).append(
            registration.tournament_id
        )
    return {
        "users": [public_user(user) for user in users],
        "players": [public_player(user) for user in users],
        "tournaments": [
            public_tournament(tournament, session) for tournament in tournaments
        ],
        "registrations": registration_map,
    }


@app.post("/api/auth/register")
def register(body: RegisterBody, session: SessionDependency) -> dict[str, Any]:
    clean_username = body.username.strip()
    clean_email = body.email.strip()
    clean_phone = body.phone.strip()
    errors = {}
    if session.exec(
        select(User).where(func.lower(User.username) == clean_username.lower())
    ).first():
        errors["username"] = "That username is already taken."
    if session.exec(
        select(User).where(func.lower(User.email) == clean_email.lower())
    ).first():
        errors["email"] = "An account with this email already exists."
    if session.exec(select(User).where(User.phone == clean_phone)).first():
        errors["phone"] = "This phone number is already registered."
    if errors:
        return {"ok": False, "errors": errors}
    user = User(
        full_name=body.full_name.strip(),
        username=clean_username,
        email=clean_email,
        phone=clean_phone,
        password_hash=hash_password(body.password),
    )
    session.add(user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return {"ok": False, "errors": {"username": "Account details already exist."}}
    session.refresh(user)
    return {
        "ok": True,
        "token": create_access_token(user.username),
        "user": public_user(user),
    }


@app.post("/api/auth/login")
def login(body: LoginBody, session: SessionDependency) -> dict[str, Any]:
    ident = body.ident.strip().lower()
    user = session.exec(
        select(User).where(
            or_(func.lower(User.username) == ident, func.lower(User.email) == ident)
        )
    ).first()
    if user is None:
        return {"ok": False, "error": "No account found. Please register first."}
    if not verify_password(body.password, user.password_hash):
        return {"ok": False, "error": "Incorrect password. Try again."}
    return {
        "ok": True,
        "token": create_access_token(user.username),
        "user": public_user(user),
    }


@app.put("/api/users/me")
def update_user(
    body: UpdateUserBody, session: SessionDependency, current_user: CurrentUser
) -> dict[str, Any]:
    values = body.model_dump(exclude_unset=True)
    field_map = {"full_name": "full_name", "fav_game": "fav_game"}
    old_username = current_user.username
    new_username = values.get("username", old_username)
    if isinstance(new_username, str):
        new_username = new_username.strip()
    errors = {}
    for field in ("username", "email", "phone"):
        value = values.get(field)
        if value is not None:
            column = getattr(User, field)
            if session.exec(
                select(User).where(
                    func.lower(column) == value.strip().lower(),
                    User.id != current_user.id,
                )
            ).first():
                errors[field] = f"Another account uses this {field}."
    if errors:
        return {"ok": False, "errors": errors}
    for key, value in values.items():
        setattr(current_user, field_map.get(key, key), value.strip() if isinstance(value, str) else value)
    if new_username != old_username:
        for registration in session.exec(
            select(TournamentRegistration).where(
                TournamentRegistration.username == old_username
            )
        ).all():
            registration.username = new_username
            session.add(registration)
        for message in session.exec(
            select(Message).where(
                or_(
                    Message.sender_username == old_username,
                    Message.receiver_username == old_username,
                )
            )
        ).all():
            if message.sender_username == old_username:
                message.sender_username = new_username
            if message.receiver_username == old_username:
                message.receiver_username = new_username
            session.add(message)
    session.add(current_user)
    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return {"ok": False, "errors": {"username": "Account details already exist."}}
    session.refresh(current_user)
    return {
        "ok": True,
        "token": create_access_token(current_user.username),
        "user": public_user(current_user),
    }


@app.get("/api/tournaments")
def list_tournaments(session: SessionDependency) -> list[dict[str, Any]]:
    tournaments = session.exec(select(Tournament).order_by(Tournament.id)).all()
    return [public_tournament(tournament, session) for tournament in tournaments]


@app.post("/api/tournaments")
def create_tournament(
    body: TournamentBody, session: SessionDependency, current_user: CurrentUser
) -> dict[str, Any]:
    values = body.model_dump(by_alias=False)
    tournament_id = f"c{time.time_ns()}"
    tournament = Tournament(
        id=tournament_id,
        name=values["name"],
        game=values["game"],
        date=values["date"],
        time=values["time"],
        fee=values["fee"],
        prize=values["prize"],
        max_slots=values["max_slots"],
        base_taken=0,
        unit=values["unit"],
        status="upcoming",
        host=values["host"] or current_user.full_name,
        host_username=current_user.username,
        desc=values["description"],
    )
    session.add(tournament)
    session.commit()
    session.refresh(tournament)
    return public_tournament(tournament, session)


@app.post("/api/tournaments/{tournament_id}/register")
def register_for_tournament(
    tournament_id: str, session: SessionDependency, current_user: CurrentUser
) -> dict[str, Any]:
    tournament = session.get(Tournament, tournament_id)
    if tournament is None:
        return {"ok": False, "message": "Tournament not found."}
    if tournament.status != "upcoming":
        return {"ok": False, "message": "Registration is closed for this tournament."}
    existing = session.exec(
        select(TournamentRegistration).where(
            TournamentRegistration.tournament_id == tournament_id,
            TournamentRegistration.username == current_user.username,
        )
    ).first()
    if existing is not None:
        return {"ok": False, "message": "You are already registered for this tournament."}
    taken = session.exec(
        select(func.count()).select_from(TournamentRegistration).where(
            TournamentRegistration.tournament_id == tournament_id
        )
    ).one()
    if tournament.base_taken + taken >= tournament.max_slots:
        return {"ok": False, "message": "Sorry, all slots are filled."}
    session.add(
        TournamentRegistration(
            tournament_id=tournament_id, username=current_user.username
        )
    )
    session.commit()
    return {
        "ok": True,
        "message": f"You're registered for {tournament.name}! See you in the lobby.",
    }


@app.patch("/api/tournaments/{tournament_id}/status")
def update_tournament_status(
    tournament_id: str,
    body: StatusBody,
    session: SessionDependency,
    current_user: CurrentUser,
) -> dict[str, Any]:
    tournament = session.get(Tournament, tournament_id)
    if tournament is None:
        raise HTTPException(status_code=404, detail="Tournament not found")
    if current_user.role != "admin" and tournament.host_username != current_user.username:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if body.status not in {"upcoming", "ongoing", "completed"}:
        raise HTTPException(status_code=422, detail="Invalid tournament status")
    tournament.status = body.status
    session.add(tournament)
    session.commit()
    session.refresh(tournament)
    return public_tournament(tournament, session)


@app.get("/api/messages/conversations")
def conversations(session: SessionDependency, current_user: CurrentUser) -> list[dict[str, Any]]:
    messages = session.exec(
        select(Message)
        .where(
            or_(
                Message.sender_username == current_user.username,
                Message.receiver_username == current_user.username,
            )
        )
        .order_by(Message.created_at, Message.id)
    ).all()
    grouped: dict[str, list[Message]] = {}
    for message in messages:
        partner = (
            message.receiver_username
            if message.sender_username == current_user.username
            else message.sender_username
        )
        grouped.setdefault(partner, []).append(message)
    return [
        {
            "id": partner,
            "last": group[-1].text,
            "time": group[-1].time_label,
            "unread": 0,
            "msgs": [public_message(message, current_user.username) for message in group],
        }
        for partner, group in grouped.items()
    ]


@app.post("/api/messages/send")
async def send_message(
    body: SendMessageBody, session: SessionDependency, current_user: CurrentUser
) -> dict[str, Any]:
    receiver = session.exec(
        select(User).where(User.username == body.receiver_username)
    ).first()
    if receiver is None:
        raise HTTPException(status_code=404, detail="Recipient not found")
    now = datetime.now(timezone.utc)
    message = Message(
        sender_username=current_user.username,
        receiver_username=receiver.username,
        text=body.text,
        time_label=now.astimezone().strftime("%I:%M %p").lstrip("0"),
        status="delivered",
        is_file=body.is_file,
        created_at=now,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    await manager.send_to_user(
        receiver.username,
        {
            "type": "chat_message",
            "id": message.id,
            "from": current_user.username,
            "to": receiver.username,
            "text": message.text,
            "time": message.time_label,
            "status": message.status,
            "isFile": message.is_file,
        },
    )
    serialized = public_message(message, current_user.username)
    return {"ok": True, "message": serialized}


@app.delete("/api/messages/conversations/{partner}")
def delete_conversation(
    partner: str, session: SessionDependency, current_user: CurrentUser
) -> dict[str, bool]:
    messages = session.exec(
        select(Message).where(
            or_(
                (
                    (Message.sender_username == current_user.username)
                    & (Message.receiver_username == partner)
                ),
                (
                    (Message.sender_username == partner)
                    & (Message.receiver_username == current_user.username)
                ),
            )
        )
    ).all()
    for message in messages:
        session.delete(message)
    session.commit()
    return {"ok": True}


@app.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, session: SessionDependency) -> None:
    token = websocket.query_params.get("token", "")
    username = decode_access_token(token)
    user = (
        session.exec(select(User).where(User.username == username)).first()
        if username
        else None
    )
    if user is None:
        await websocket.close(code=1008)
        return
    await manager.connect(user.username, websocket)
    user.online = True
    user.last_seen = "Online now"
    session.add(user)
    session.commit()
    await manager.broadcast_presence(user.username, True)
    try:
        while True:
            payload = await websocket.receive_json()
            event_type = payload.get("type")
            if event_type == "typing":
                recipient = payload.get("to")
                if isinstance(recipient, str):
                    await manager.send_to_user(
                        recipient, {"type": "typing", "from": user.username}
                    )
                continue
            if event_type == "mark_seen":
                partner = payload.get("from")
                if isinstance(partner, str):
                    unseen = session.exec(
                        select(Message).where(
                            Message.sender_username == partner,
                            Message.receiver_username == user.username,
                            Message.status == "delivered",
                        )
                    ).all()
                    for message in unseen:
                        message.status = "seen"
                        session.add(message)
                    session.commit()
                    await manager.send_to_user(
                        partner,
                        {"type": "messages_seen", "from": user.username},
                    )
                continue
            recipient = payload.get("to") or payload.get("receiverUsername")
            text = payload.get("text")
            if event_type not in (None, "chat_message") or not isinstance(recipient, str) or not isinstance(text, str):
                await websocket.send_json(
                    {"type": "error", "message": "A valid chat_message with to and text is required"}
                )
                continue
            receiver = session.exec(select(User).where(User.username == recipient)).first()
            if receiver is None:
                await websocket.send_json(
                    {"type": "error", "message": "Recipient not found"}
                )
                continue
            now = datetime.now(timezone.utc)
            message = Message(
                sender_username=user.username,
                receiver_username=receiver.username,
                text=text,
                time_label=now.astimezone().strftime("%I:%M %p").lstrip("0"),
                is_file=bool(payload.get("isFile", False)),
                created_at=now,
            )
            session.add(message)
            session.commit()
            session.refresh(message)
            event = {
                "type": "chat_message",
                "id": message.id,
                "from": user.username,
                "to": receiver.username,
                "text": message.text,
                "time": message.time_label,
                "status": message.status,
                "isFile": message.is_file,
            }
            await manager.send_to_user(user.username, event)
            await manager.send_to_user(receiver.username, event)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(user.username)
        user.online = False
        user.last_seen = (
            "Last seen today at "
            + datetime.now().astimezone().strftime("%I:%M %p").lstrip("0")
        )
        session.add(user)
        session.commit()
        await manager.broadcast_presence(user.username, False)


app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
