from sqlmodel import Field, SQLModel


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
