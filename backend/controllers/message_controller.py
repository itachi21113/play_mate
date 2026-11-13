from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, WebSocket
from sqlmodel import Session

from backend.core.database import get_session
from backend.core.security import decode_access_token, get_current_user
from backend.core.ws_manager import manager
from backend.models import User
from backend.repositories import user_repo
from backend.schemas.message import SendMessageRequest
from backend.services.message_service import (
    build_conversations_for_user,
    clear_conversation,
    handle_websocket_events,
    send_message_and_notify,
)

router = APIRouter()
SessionDependency = Annotated[Session, Depends(get_session)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("/api/messages/conversations")
def conversations(
    session: SessionDependency, current_user: CurrentUser
) -> list[dict]:
    return build_conversations_for_user(session, current_user)


@router.post("/api/messages/send")
async def send_message(
    body: SendMessageRequest, session: SessionDependency, current_user: CurrentUser
) -> dict:
    receiver = user_repo.get_by_username(session, body.receiver_username)
    if receiver is None:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return await send_message_and_notify(
        session, current_user, receiver, body.text, body.is_file
    )


@router.delete("/api/messages/conversations/{partner}")
def delete_conversation(
    partner: str, session: SessionDependency, current_user: CurrentUser
) -> dict[str, bool]:
    return clear_conversation(session, current_user, partner)


@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket, session: SessionDependency) -> None:
    username = decode_access_token(websocket.query_params.get("token", ""))
    user = user_repo.get_by_username(session, username) if username else None
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
        await handle_websocket_events(websocket, session, user)
    finally:
        manager.disconnect(user.username)
        user.online = False
        from backend.schemas.auth import now_time_label

        user.last_seen = "Last seen today at " + now_time_label()
        session.add(user)
        session.commit()
        await manager.broadcast_presence(user.username, False)
