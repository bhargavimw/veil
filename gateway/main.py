"""VEIL gateway FastAPI app and MCP server entrypoint.

Mounts the ``/api`` router (REST) and hosts the root-level
``/health`` and ``/ws/events`` endpoints so they match the AGENTS.md
contract exactly (WS at ``/ws/events``, not ``/api/ws/events``).
"""

from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from gateway.api.router import install, store

app = FastAPI(title="VEIL Gateway", version="0.1.0")


install(app)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness/readiness check."""
    return {"status": "ok"}


@app.get("/api/health")
async def api_health() -> dict[str, bool]:
    """Liveness/readiness check under the API prefix."""
    return {"ok": True}


@app.websocket("/ws/events")
async def ws_events(ws: WebSocket) -> None:
    """Push each new ``VeilEvent`` to connected dashboard clients as JSON."""
    await ws.accept()
    queue = store.subscribe()
    try:
        while True:
            event = await queue.get()
            await ws.send_text(event.model_dump_json())
    except WebSocketDisconnect:
        pass
    finally:
        store.unsubscribe(queue)


# MCP server (server toward agents) and MCP client (toward services) wiring,
# plus HTTP endpoints, go here in later tasks.
