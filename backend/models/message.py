from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


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
