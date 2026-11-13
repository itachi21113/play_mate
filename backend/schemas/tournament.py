from pydantic import BaseModel, ConfigDict, Field


class CreateTournamentRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    game: str
    date: str
    time: str
    fee: int = 0
    prize: int = 0
    max_slots: int = Field(alias="max", gt=0)
    unit: str = "players"
    host: str | None = None
    host_username: str | None = Field(default=None, alias="hostUsername")
    description: str = Field(alias="desc")


class UpdateTournamentStatusRequest(BaseModel):
    status: str
