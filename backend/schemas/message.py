from pydantic import BaseModel, Field


class SendMessageRequest(BaseModel):
    receiver_username: str = Field(alias="receiverUsername")
    text: str
    is_file: bool = Field(default=False, alias="isFile")
