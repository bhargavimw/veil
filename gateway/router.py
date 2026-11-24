"""Request routing to the right service connector."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class RouteContext:
    """Carries everything a request/response needs as it moves through VEIL."""

    agent_id: str
    service: str
    tool: str
    parameters: dict = field(default_factory=dict)
    identity_alias: dict | None = None
    policy_decision: str | None = None
    masked_fields: list[str] = field(default_factory=list)
    audit_id: str | None = None


class Router:
    """Selects and invokes the connector for a given service."""

    async def route(self, ctx: RouteContext) -> RouteContext:
        """Forward the call to the service connector (stub)."""
        raise NotImplementedError("connector routing is not implemented yet")
