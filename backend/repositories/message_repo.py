from sqlalchemy import or_
from sqlmodel import Session, select

from backend.models import Message


def get_user_messages(session: Session, username: str) -> list[Message]:
    return list(
        session.exec(
            select(Message)
            .where(
                or_(
                    Message.sender_username == username,
                    Message.receiver_username == username,
                )
            )
            .order_by(Message.created_at, Message.id)
        ).all()
    )


def create_message(session: Session, message: Message) -> Message:
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def mark_messages_seen(
    session: Session, sender_username: str, receiver_username: str
) -> None:
    messages = session.exec(
        select(Message).where(
            Message.sender_username == sender_username,
            Message.receiver_username == receiver_username,
            Message.status == "delivered",
        )
    ).all()
    for message in messages:
        message.status = "seen"
        session.add(message)
    session.commit()


def delete_conversation_messages(session: Session, username: str, partner: str) -> None:
    messages = session.exec(
        select(Message).where(
            or_(
                (Message.sender_username == username)
                & (Message.receiver_username == partner),
                (Message.sender_username == partner)
                & (Message.receiver_username == username),
            )
        )
    ).all()
    for message in messages:
        session.delete(message)
    session.commit()
