"""VEIL gateway FastAPI app and MCP server entrypoint."""

from __future__ import annotations

from fastapi import FastAPI

app = FastAPI(title="VEIL Gateway", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness/readiness check."""
    return {"status": "ok"}


# MCP server (server toward agents) and MCP client (toward services) wiring,
# plus HTTP endpoints, go here in later tasks.
