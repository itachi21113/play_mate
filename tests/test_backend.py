from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

from backend import database
from backend.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(test_engine)
    database.init_db_and_seed(test_engine)

    def get_test_session():
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[database.get_session] = get_test_session
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
    test_engine.dispose()


def register(client: TestClient, username: str = "test_player") -> dict:
    response = client.post(
        "/api/auth/register",
        json={
            "fullName": "Test Player",
            "username": username,
            "email": f"{username}@example.com",
            "phone": f"9{sum(map(ord, username)) % 1_000_000_000:09d}",
            "password": "Player123",
        },
    )
    assert response.status_code == 200
    return response.json()


def test_bootstrap_seed_data(client: TestClient) -> None:
    response = client.get("/api/bootstrap")
    assert response.status_code == 200
    data = response.json()
    assert len(data["users"]) == 14
    assert len(data["players"]) == 14
    assert len(data["tournaments"]) == 14
    assert data["users"][0]["role"] == "admin"
    assert data["tournaments"][0]["hostUsername"] == "rahul_gamer"
    assert data["registrations"] == {}


def test_seeded_message_conversations(client: TestClient) -> None:
    login_response = client.post(
        "/api/auth/login",
        json={"ident": "rahul_gamer", "password": "Demo@123"},
    )
    headers = {"Authorization": f"Bearer {login_response.json()['token']}"}
    conversations = client.get("/api/messages/conversations", headers=headers)
    assert conversations.status_code == 200
    data = conversations.json()
    assert {conversation["id"] for conversation in data} == {
        "amit_pro",
        "sneha_plays",
        "karan_elite",
        "rohanx",
    }
    assert sum(len(conversation["msgs"]) for conversation in data) == 11


def test_register_and_login(client: TestClient) -> None:
    registered = register(client)
    assert registered["ok"] is True
    assert registered["user"]["username"] == "test_player"
    assert registered["token"]

    response = client.post(
        "/api/auth/login",
        json={"ident": "TEST_PLAYER", "password": "Player123"},
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
    assert response.json()["user"]["username"] == "test_player"

    email_response = client.post(
        "/api/auth/login",
        json={"ident": "TEST_PLAYER@example.com", "password": "Player123"},
    )
    assert email_response.json()["ok"] is True


def test_tournament_creation_registration_and_status_rbac(client: TestClient) -> None:
    user = register(client)
    headers = {"Authorization": f"Bearer {user['token']}"}
    created = client.post(
        "/api/tournaments",
        headers=headers,
        json={
            "name": "Test Cup",
            "game": "bgmi",
            "date": "2026-12-01",
            "time": "18:00",
            "fee": 10,
            "prize": 1000,
            "max": 1,
            "unit": "players",
            "desc": "Test tournament",
        },
    )
    assert created.status_code == 200
    tournament_id = created.json()["id"]
    assert created.json()["hostUsername"] == "test_player"

    registered = client.post(
        f"/api/tournaments/{tournament_id}/register", headers=headers
    )
    assert registered.json()["ok"] is True
    duplicate = client.post(
        f"/api/tournaments/{tournament_id}/register", headers=headers
    )
    assert duplicate.json()["ok"] is False
    other_user = register(client, "other_player")
    full_slots = client.post(
        f"/api/tournaments/{tournament_id}/register",
        headers={"Authorization": f"Bearer {other_user['token']}"},
    )
    assert full_slots.json()["ok"] is False
    tournaments = client.get("/api/tournaments").json()
    assert next(item for item in tournaments if item["id"] == tournament_id)["taken"] == 1

    denied = client.patch(
        f"/api/tournaments/t1/status",
        headers=headers,
        json={"status": "completed"},
    )
    assert denied.status_code == 403
    admin = client.post(
        "/api/auth/login",
        json={"ident": "demo@playmate.com", "password": "Demo@123"},
    ).json()
    admin_allowed = client.patch(
        "/api/tournaments/t1/status",
        headers={"Authorization": f"Bearer {admin['token']}"},
        json={"status": "ongoing"},
    )
    assert admin_allowed.status_code == 200
    allowed = client.patch(
        f"/api/tournaments/{tournament_id}/status",
        headers=headers,
        json={"status": "ongoing"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["status"] == "ongoing"


def test_websocket_chat_auth_and_delivery(client: TestClient) -> None:
    registered = register(client)
    token = registered["token"]
    with client.websocket_connect(f"/ws/chat?token={token}") as websocket:
        websocket.send_json(
            {"receiverUsername": "rahul_gamer", "text": "Hello from websocket"}
        )
        event = websocket.receive_json()
        assert event["type"] == "presence"
        event = websocket.receive_json()
        assert event["type"] == "message"
        assert event["message"]["text"] == "Hello from websocket"
