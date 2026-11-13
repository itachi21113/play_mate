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
