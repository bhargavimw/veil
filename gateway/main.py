"""VEIL gateway FastAPI app and MCP server entrypoint."""

from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from gateway.api.router import install, store

app = FastAPI(title="VEIL Gateway", version="0.1.0")


install(app)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness/readiness check (root path, kept for backwards compat)."""
    return {"status": "ok"}


@app.websocket("/ws/events")
async def ws_events(ws: WebSocket) -> None:
    """Broadcast every new VeilEvent to all connected dashboard clients."""
    await ws.accept()
    store.subscribe(ws)
    try:
        while True:
            # Keep the connection open; inbound messages are not used.
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        store.unsubscribe(ws)


# MCP server (server toward agents) and MCP client (toward services) wiring,
# plus HTTP endpoints, go here in later tasks.
