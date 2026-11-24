"""Gmail connector (stub only)."""

from __future__ import annotations

from connectors.base import Connector


class GmailConnector(Connector):
    """Placeholder Gmail connector. Real implementation comes later."""

    async def list_tools(self) -> list[str]:
        raise NotImplementedError("Gmail connector is not implemented yet")

    async def call_tool(self, name: str, arguments: dict) -> dict:
        raise NotImplementedError("Gmail connector is not implemented yet")

    def required_scopes(self, tool: str) -> list[str]:
        raise NotImplementedError("Gmail connector is not implemented yet")
