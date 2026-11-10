from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, username: str, ws: WebSocket) -> None:
        await ws.accept()
        self.active_connections[username] = ws

    def disconnect(self, username: str) -> None:
        self.active_connections.pop(username, None)

    def is_online(self, username: str) -> bool:
        return username in self.active_connections

    async def send_to_user(self, username: str, data: dict) -> None:
        websocket = self.active_connections.get(username)
        if websocket is not None:
            await websocket.send_json(data)

    async def broadcast_presence(self, username: str, online: bool) -> None:
        event = {"type": "presence", "username": username, "online": online}
        for websocket in tuple(self.active_connections.values()):
            await websocket.send_json(event)


manager = ConnectionManager()
