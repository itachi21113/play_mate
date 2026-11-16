from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from backend.core import database
from backend.core.security import create_access_token
from backend.main import app
from backend.models import User


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


def register(
    client: TestClient,
    username: str = "test_player",
    role: str = "player",
    organization_name: str = "",
    admin_secret: str = "",
) -> dict:
    response = client.post(
        "/api/auth/register",
        json={
            "fullName": "Test Player",
            "username": username,
            "email": f"{username}@example.com",
            "phone": f"9{sum(map(ord, username)) % 1_000_000_000:09d}",
            "password": "Player123",
            "role": role,
            "organizationName": organization_name,
            "adminSecret": admin_secret,
        },
    )
    assert response.status_code == 200
    return response.json()


def admin_headers(client: TestClient) -> dict[str, str]:
    admin = client.post(
        "/api/auth/login",
        json={"ident": "demo@playmate.com", "password": "Demo@123"},
    ).json()
    return {"Authorization": f"Bearer {admin['token']}"}


def approve_user(client: TestClient, username: str) -> dict:
    response = client.patch(
        f"/api/admin/users/{username}/approval",
        headers=admin_headers(client),
        json={"status": "approved"},
    )
    assert response.status_code == 200
    return response.json()


def login(client: TestClient, ident: str, password: str = "Player123") -> dict:
    response = client.post(
        "/api/auth/login",
        json={"ident": ident, "password": password},
    )
    assert response.status_code == 200
    return response.json()


def test_bootstrap_seed_data(client: TestClient) -> None:
    response = client.get("/api/bootstrap")
    assert response.status_code == 200
    data = response.json()
    assert len(data["users"]) == 14
    assert len(data["players"]) == 11
    assert len(data["tournaments"]) == 14
    assert data["users"][0]["role"] == "admin"
    assert all(user["approvalStatus"] == "approved" for user in data["users"])
    organizers = {user["username"]: user for user in data["users"] if user["role"] == "organizer"}
    assert organizers["amit_pro"]["organizationName"] == "Amit Esports"
    assert organizers["sneha_plays"]["organizationName"] == "Sneha Gaming Club"
    assert data["tournaments"][0]["hostUsername"] == "amit_pro"
    assert data["registrations"] == {}


def test_legacy_user_schema_is_migrated() -> None:
    legacy_engine = create_engine("sqlite://")
    try:
        with legacy_engine.begin() as connection:
            connection.exec_driver_sql(
                'CREATE TABLE "user" ('
                "id INTEGER PRIMARY KEY, username VARCHAR NOT NULL UNIQUE, "
                "full_name VARCHAR NOT NULL, email VARCHAR NOT NULL UNIQUE, "
                "phone VARCHAR NOT NULL UNIQUE, password_hash VARCHAR NOT NULL, "
                "bio VARCHAR NOT NULL DEFAULT '', fav_game VARCHAR NOT NULL DEFAULT '', "
                "avatar VARCHAR NOT NULL DEFAULT '', games_json VARCHAR NOT NULL DEFAULT '[]', "
                "online BOOLEAN NOT NULL DEFAULT 1, last_seen VARCHAR NOT NULL DEFAULT '', "
                "reply_hint VARCHAR NOT NULL DEFAULT '', role VARCHAR NOT NULL DEFAULT 'player')"
            )
            connection.exec_driver_sql(
                'INSERT INTO "user" (username, full_name, email, phone, password_hash) '
                "VALUES ('rahul_gamer', 'Rahul Gamer', 'demo@playmate.com', "
                "'9876543210', 'legacy-hash')"
            )
        database.init_db_and_seed(legacy_engine)
        with Session(legacy_engine) as session:
            admin = session.exec(
                select(User).where(User.username == "rahul_gamer")
            ).one()
            assert admin.role == "admin"
            assert admin.approval_status == "approved"
            assert admin.organization_name == ""
    finally:
        legacy_engine.dispose()


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


def test_send_message_rest_fallback(client: TestClient) -> None:
    register(client)
    approve_user(client, "test_player")
    registered = login(client, "test_player")
    response = client.post(
        "/api/messages/send",
        headers={"Authorization": f"Bearer {registered['token']}"},
        json={
            "receiverUsername": "rahul_gamer",
            "text": "REST fallback message",
            "isFile": True,
        },
    )
    assert response.status_code == 200
    assert response.json()["message"]["text"] == "REST fallback message"
    assert response.json()["message"]["isFile"] is True


def test_register_and_login(client: TestClient) -> None:
    registered = register(client)
    assert registered["ok"] is True
    assert registered["pending"] is True
    assert "token" not in registered
    assert registered["message"] == (
        "Registration submitted! Waiting for Admin approval before you can log in."
    )
    assert login(client, "TEST_PLAYER") == {
        "ok": False,
        "error": "Your account is pending Admin approval.",
    }
    protected = client.get(
        "/api/messages/conversations",
        headers={
            "Authorization": f"Bearer {create_access_token('test_player')}"
        },
    )
    assert protected.status_code == 403

    approve_user(client, "test_player")
    authenticated = login(client, "TEST_PLAYER")
    assert authenticated["ok"] is True
    assert authenticated["user"]["username"] == "test_player"

    email_response = login(client, "TEST_PLAYER@example.com")
    assert email_response["ok"] is True
    update = client.put(
        "/api/users/me",
        headers={"Authorization": f"Bearer {authenticated['token']}"},
        json={"username": "renamed_player"},
    )
    assert update.status_code == 200
    assert update.json()["user"]["username"] == "renamed_player"
    assert update.json()["token"]
    updated_profile = client.get(
        "/api/messages/conversations",
        headers={"Authorization": f"Bearer {update.json()['token']}"},
    )
    assert updated_profile.status_code == 200


def test_tournament_creation_registration_and_status_rbac(client: TestClient) -> None:
    register(client)
    approve_user(client, "test_player")
    player_headers = {
        "Authorization": f"Bearer {login(client, 'test_player')['token']}"
    }
    organizer_headers = {
        "Authorization": f"Bearer {login(client, 'amit_pro', 'Demo@123')['token']}"
    }
    admin_headers_value = admin_headers(client)
    tournament_request = {
        "name": "Test Cup",
        "game": "bgmi",
        "date": "2026-12-01",
        "time": "18:00",
        "fee": 10,
        "prize": 1000,
        "max": 1,
        "unit": "players",
        "host": "Spoofed Host",
        "desc": "Test tournament",
    }
    player_create = client.post(
        "/api/tournaments",
        headers=player_headers,
        json=tournament_request,
    )
    assert player_create.status_code == 403
    admin_create = client.post(
        "/api/tournaments",
        headers=admin_headers_value,
        json=tournament_request,
    )
    assert admin_create.status_code == 403
    created = client.post(
        "/api/tournaments",
        headers=organizer_headers,
        json=tournament_request,
    )
    assert created.status_code == 200
    tournament_id = created.json()["id"]
    assert created.json()["hostUsername"] == "amit_pro"
    assert created.json()["host"] == "Amit Esports"

    organizer_register = client.post(
        f"/api/tournaments/{tournament_id}/register",
        headers=organizer_headers,
    )
    assert organizer_register.json() == {
        "ok": False,
        "message": "Only player accounts can participate in tournaments.",
    }
    admin_register = client.post(
        f"/api/tournaments/{tournament_id}/register",
        headers=admin_headers_value,
    )
    assert admin_register.json() == organizer_register.json()
    registered = client.post(
        f"/api/tournaments/{tournament_id}/register", headers=player_headers
    )
    assert registered.json()["ok"] is True
    duplicate = client.post(
        f"/api/tournaments/{tournament_id}/register", headers=player_headers
    )
    assert duplicate.json()["ok"] is False
    register(client, "other_player")
    approve_user(client, "other_player")
    full_slots = client.post(
        f"/api/tournaments/{tournament_id}/register",
        headers={
            "Authorization": f"Bearer {login(client, 'other_player')['token']}"
        },
    )
    assert full_slots.json()["ok"] is False
    tournaments = client.get("/api/tournaments").json()
    assert next(item for item in tournaments if item["id"] == tournament_id)["taken"] == 1

    denied = client.patch(
        f"/api/tournaments/t1/status",
        headers=player_headers,
        json={"status": "completed"},
    )
    assert denied.status_code == 403
    admin_allowed = client.patch(
        "/api/tournaments/t1/status",
        headers=admin_headers(client),
        json={"status": "ongoing"},
    )
    assert admin_allowed.status_code == 200
    allowed = client.patch(
        f"/api/tournaments/{tournament_id}/status",
        headers=organizer_headers,
        json={"status": "ongoing"},
    )
    assert allowed.status_code == 200
    assert allowed.json()["status"] == "ongoing"
    participants = client.get(
        f"/api/tournaments/{tournament_id}/participants",
        headers=organizer_headers,
    )
    assert participants.status_code == 200
    assert participants.json()[0]["username"] == "test_player"
    other_organizer = {
        "Authorization": f"Bearer {login(client, 'sneha_plays', 'Demo@123')['token']}"
    }
    denied_participants = client.get(
        f"/api/tournaments/{tournament_id}/participants",
        headers=other_organizer,
    )
    assert denied_participants.status_code == 403


def test_admin_secret_and_rejected_user_login(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("ADMIN_SECRET_CODE", "PLAYMATE_ADMIN_2026")
    invalid_organizer = client.post(
        "/api/auth/register",
        json={
            "fullName": "Test Organization",
            "username": "no_org_name",
            "email": "no-org-name@example.com",
            "phone": "9123456789",
            "password": "Player123",
            "role": "organizer",
        },
    )
    assert invalid_organizer.status_code == 422
    invalid_admin = register(
        client, "wrong_admin", role="admin", admin_secret="wrong"
    )
    assert invalid_admin["ok"] is False
    assert "adminSecret" in invalid_admin["errors"]

    valid_admin = register(
        client,
        "pending_admin",
        role="admin",
        admin_secret="PLAYMATE_ADMIN_2026",
    )
    assert valid_admin["ok"] is True
    assert valid_admin["pending"] is True
    assert "token" not in valid_admin

    register(client, "rejected_user")
    rejected = client.patch(
        "/api/admin/users/rejected_user/approval",
        headers=admin_headers(client),
        json={"status": "rejected"},
    )
    assert rejected.status_code == 200
    assert login(client, "rejected_user") == {
        "ok": False,
        "error": "Your registration request was declined by an Admin.",
    }


def test_first_admin_is_auto_approved_and_can_login(client: TestClient) -> None:
    demote_seeded_admin = client.patch(
        "/api/admin/users/rahul_gamer/approval",
        headers=admin_headers(client),
        json={"status": "rejected"},
    )
    assert demote_seeded_admin.status_code == 200
    first_admin = register(client, "first_admin", role="admin")
    assert first_admin["ok"] is True
    assert first_admin["user"]["role"] == "admin"
    assert first_admin["user"]["approvalStatus"] == "approved"
    assert login(client, "first_admin")["ok"] is True


def test_admin_can_list_users_and_delete_tournament(client: TestClient) -> None:
    register(client, "pending_user")
    headers = admin_headers(client)
    users = client.get("/api/admin/users", headers=headers)
    assert users.status_code == 200
    pending = next(
        user for user in users.json() if user["username"] == "pending_user"
    )
    assert pending["approvalStatus"] == "pending"
    approve_user(client, "pending_user")
    player_headers = {
        "Authorization": f"Bearer {login(client, 'pending_user')['token']}"
    }

    tournament_id = client.get("/api/tournaments").json()[0]["id"]
    registration = client.post(
        f"/api/tournaments/{tournament_id}/register",
        headers=player_headers,
    )
    assert registration.json()["ok"] is True
    deleted = client.delete(
        f"/api/admin/tournaments/{tournament_id}",
        headers=headers,
    )
    assert deleted.status_code == 200
    assert deleted.json() == {"ok": True}
    assert all(
        tournament["id"] != tournament_id
        for tournament in client.get("/api/tournaments").json()
    )


def test_websocket_chat_auth_and_delivery(client: TestClient) -> None:
    register(client)
    approve_user(client, "test_player")
    token = login(client, "test_player")["token"]
    with client.websocket_connect(f"/ws/chat?token={token}") as websocket:
        assert websocket.receive_json()["type"] == "presence"
        websocket.send_json({"type": "typing", "to": "test_player"})
        assert websocket.receive_json() == {"type": "typing", "from": "test_player"}

        websocket.send_json(
            {"type": "chat_message", "to": "test_player", "text": "Hello from websocket"}
        )
        sent = websocket.receive_json()
        echoed = websocket.receive_json()
        assert sent["type"] == echoed["type"] == "chat_message"
        assert sent["text"] == "Hello from websocket"
        assert sent["from"] == "test_player"

        websocket.send_json({"type": "mark_seen", "from": "test_player"})
        assert websocket.receive_json() == {
            "type": "messages_seen",
            "from": "test_player",
        }
