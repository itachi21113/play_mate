import re
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

PHONE_CLEAN_RE = re.compile(r"[\s-]")
USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,20}$")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]{2,}$")
FULL_NAME_RE = re.compile(r"^[A-Za-z][A-Za-z .'-]*$")


def clean_phone(value: str) -> str:
    value = PHONE_CLEAN_RE.sub("", value)
    return re.sub(r"^(\+91|91|0)(?=\d{10}$)", "", value)


def now_time_label() -> str:
    return datetime.now().astimezone().strftime("%I:%M %p").lstrip("0")


class RegisterRequest(BaseModel):
    full_name: str = Field(alias="fullName", min_length=2)
    username: str = Field(min_length=3, max_length=20)
    email: str
    phone: str
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    ident: str
    password: str


class UpdateProfileRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    full_name: str | None = Field(default=None, alias="fullName")
    username: str | None = None
    email: str | None = None
    phone: str | None = None
    bio: str | None = None
    fav_game: str | None = Field(default=None, alias="favGame")
    avatar: str | None = None
