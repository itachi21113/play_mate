from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    full_name: str
    email: str = Field(unique=True, index=True)
    phone: str = Field(unique=True)
    password_hash: str
    bio: str = ""
    fav_game: str = ""
    avatar: str = ""
    games_json: str = "[]"
    online: bool = True
    last_seen: str = "Online now"
    reply_hint: str = ""
    role: str = "player"


class Tournament(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    game: str
    date: str
    time: str
    fee: int
    prize: int
    max_slots: int
    base_taken: int = 0
    unit: str = "players"
    status: str = "upcoming"
    host: str
    host_username: str = Field(index=True)
    desc: str


class TournamentRegistration(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    tournament_id: str = Field(index=True)
    username: str = Field(index=True)


class Message(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    sender_username: str = Field(index=True)
    receiver_username: str = Field(index=True)
    text: str
    time_label: str
    status: str = "delivered"
    is_file: bool = False
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), index=True
    )
