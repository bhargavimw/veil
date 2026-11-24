"""Audit log models."""

from __future__ import annotations

from pydantic import BaseModel


class AuditEvent(BaseModel):
    """One recorded agent->service interaction."""

    agent: str
    service: str
    tool: str
    action: str
    decision: str
    details: dict = {}
