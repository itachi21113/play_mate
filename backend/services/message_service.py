from datetime import datetime, timezone

from fastapi import WebSocket, WebSocketDisconnect
from sqlmodel import Session

from backend.core.ws_manager import manager
from backend.models import Message, User
from backend.repositories import message_repo, user_repo
from backend.schemas.auth import now_time_label


def _message_dict(message: Message, current_username: str) -> dict:
    return {
        "id": message.id, "senderUsername": message.sender_username,
        "receiverUsername": message.receiver_username,
        "from": "me" if message.sender_username == current_username else "them",
        "text": message.text, "time": message.time_label, "status": message.status,
        "isFile": message.is_file, "createdAt": message.created_at.isoformat(),
    }


def build_conversations_for_user(session: Session, current_user: User) -> list[dict]:
    grouped = {}
    for message in message_repo.get_user_messages(session, current_user.username):
        partner = message.receiver_username if message.sender_username == current_user.username else message.sender_username
        grouped.setdefault(partner, []).append(message)
    return [
        {
            "id": partner, "last": group[-1].text, "time": group[-1].time_label,
            "unread": 0,
            "msgs": [_message_dict(message, current_user.username) for message in group],
        }
        for partner, group in grouped.items()
    ]


async def send_message_and_notify(session: Session, sender: User, receiver: User, text: str, is_file: bool = False) -> dict:
    message = message_repo.create_message(
        session,
        Message(
            sender_username=sender.username, receiver_username=receiver.username,
            text=text, time_label=now_time_label(), status="delivered",
            is_file=is_file, created_at=datetime.now(timezone.utc),
        ),
    )
    event = {
        "type": "chat_message", "id": message.id, "from": sender.username,
        "to": receiver.username, "text": message.text, "time": message.time_label,
        "status": message.status, "isFile": message.is_file,
    }
    await manager.send_to_user(sender.username, event)
    await manager.send_to_user(receiver.username, event)
    if not manager.is_online(receiver.username) and receiver.reply_hint:
        reply = message_repo.create_message(
            session,
            Message(
                sender_username=receiver.username, receiver_username=sender.username,
                text=receiver.reply_hint, time_label=now_time_label(),
                status="delivered", created_at=datetime.now(timezone.utc),
            ),
        )
        await manager.send_to_user(sender.username, {
            "type": "chat_message", "id": reply.id, "from": receiver.username,
            "to": sender.username, "text": reply.text, "time": reply.time_label,
            "status": reply.status, "isFile": False,
        })
    return {"ok": True, "message": _message_dict(message, sender.username)}


def clear_conversation(session: Session, current_user: User, partner: str) -> dict:
    message_repo.delete_conversation_messages(session, current_user.username, partner)
    return {"ok": True}


async def handle_websocket_events(websocket: WebSocket, session: Session, current_user: User) -> None:
    try:
        while True:
            payload = await websocket.receive_json()
            event_type = payload.get("type")
            if event_type == "typing":
                recipient = payload.get("to")
                if isinstance(recipient, str):
                    await manager.send_to_user(recipient, {"type": "typing", "from": current_user.username})
                continue
            if event_type == "mark_seen":
                partner = payload.get("from")
                if isinstance(partner, str):
                    message_repo.mark_messages_seen(session, partner, current_user.username)
                    await manager.send_to_user(partner, {"type": "messages_seen", "from": current_user.username})
                continue
            recipient_name = payload.get("to") or payload.get("receiverUsername")
            text = payload.get("text")
            if event_type not in (None, "chat_message") or not isinstance(recipient_name, str) or not isinstance(text, str):
                await websocket.send_json({"type": "error", "message": "A valid chat_message with to and text is required"})
                continue
            receiver = user_repo.get_by_username(session, recipient_name)
            if receiver is None:
                await websocket.send_json({"type": "error", "message": "Recipient not found"})
                continue
            await send_message_and_notify(session, current_user, receiver, text, bool(payload.get("isFile", False)))
    except WebSocketDisconnect:
        return
