"""Abstract connector interface for external services."""

from __future__ import annotations

from abc import ABC, abstractmethod


class Connector(ABC):
    """A plugin that talks to one external service on behalf of VEIL."""

    @abstractmethod
    async def list_tools(self) -> list[str]:
        """Return the tools this connector exposes."""

    @abstractmethod
    async def call_tool(self, name: str, arguments: dict) -> dict:
        """Invoke one tool on the external service."""

    @abstractmethod
    def required_scopes(self, tool: str) -> list[str]:
        """Return the permission scopes required to call ``tool``."""
