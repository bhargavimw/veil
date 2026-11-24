"""Append-only audit log."""

from __future__ import annotations


class AuditLogger:
    """Records every agent interaction for privacy monitoring."""

    def log(
        self,
        agent: str,
        service: str,
        tool: str,
        decision: str,
        details: dict | None = None,
    ) -> None:
        """Append one audit event (stub: no storage wired yet)."""
        raise NotImplementedError("audit storage is not implemented yet")
