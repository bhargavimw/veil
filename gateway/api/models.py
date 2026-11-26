"""Pydantic models for the VEIL dashboard API contract.

Field names and enums match the TypeScript interfaces in AGENTS.md
exactly (snake_case, same literal unions).
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Status = Literal["allowed", "masked", "approval_needed", "blocked"]
PermissionValue = Literal["allow", "mask", "ask", "deny"]
AgentStatus = Literal["active", "paused", "revoked"]
IdentityStatus = Literal["active", "revoked"]
ApprovalStatus = Literal["pending", "approved", "denied"]
IdentityKind = Literal["email", "phone", "name", "address"]


class VeilEvent(BaseModel):
    """One audit event emitted by the gateway (mirrors dashboard contract)."""

    id: str
    timestamp: str
    agent: str
    app: str
    tool: str
    status: Status
    pii_found: list[str] = Field(default_factory=list)
    policy_rule: str = ""
    original_preview: str
    masked_preview: str


class Agent(BaseModel):
    id: str
    name: str
    status: AgentStatus = "active"
    last_active: str
    privacy_score: int = 0
    permissions: dict[str, PermissionValue] = Field(default_factory=dict)


class Identity(BaseModel):
    id: str
    kind: IdentityKind
    alias: str
    used_by: list[str] = Field(default_factory=list)
    status: IdentityStatus = "active"


class Approval(BaseModel):
    id: str
    agent: str
    app: str
    action: str
    details: str
    data_to_release: list[str] = Field(default_factory=list)
    status: ApprovalStatus = "pending"
    created_at: str


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------


class PermissionPatch(BaseModel):
    key: str
    value: PermissionValue


class AgentStatusBody(BaseModel):
    status: AgentStatus


class IdentityCreate(BaseModel):
    kind: IdentityKind


class ApprovalDecision(BaseModel):
    decision: Literal["approved", "denied"]


class KillSwitchBody(BaseModel):
    on: bool


class DemoTrigger(BaseModel):
    scenario: Literal["masked_inbox", "approval", "blocked"]
