"""Pydantic models for the VEIL dashboard API contract.

Field names and enums match the TypeScript contract in AGENTS.md section 4
(snake_case, same literal unions), extended with the additions requested for
the live gateway layer: ``destination``/``direction``/``original_payload``/
``sent_payload``/``transformations`` on ``VeilEvent``, ``username``/``card``
identity kinds plus ``scope``/``expires_at``/``use_count`` on ``Identity``,
``expires_at`` on ``Approval``, and the new ``Token``, ``Handoff``,
``MetadataRule`` and ``OversightMode`` models.

The real engine (identity vault, policy engine, PII masker, audit log) will
replace this in-memory layer later; the interfaces stay the same.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Enums / literal unions (mirror the TS contract exactly)
# ---------------------------------------------------------------------------

Status = Literal["allowed", "masked", "approval_needed", "blocked"]
PermissionValue = Literal["allow", "mask", "ask", "deny"]
AgentStatus = Literal["active", "paused", "revoked"]
IdentityStatus = Literal["active", "revoked"]
ApprovalStatus = Literal["pending", "approved", "denied"]
IdentityKind = Literal["email", "phone", "name", "username", "address", "card"]
OversightMode = Literal["restricted", "flexible", "unrestricted"]
MetadataAction = Literal["mask", "redact", "allow"]
TokenStatus = Literal["active", "revoked", "expired"]
HandoffStatus = Literal["pending", "completed", "declined", "revoked"]
Direction = Literal["inbound", "outbound"]


# ---------------------------------------------------------------------------
# Domain models
# ---------------------------------------------------------------------------


class VeilEvent(BaseModel):
    """One audit event emitted by the gateway.

    ``original_preview``/``masked_preview`` are kept for the existing
    dashboard contract (AGENTS.md section 4). ``destination``/``direction``/
    ``original_payload``/``sent_payload``/``transformations`` are the live
    gateway additions.
    """

    id: str
    timestamp: str
    agent: str
    app: str
    tool: str
    status: Status
    destination: str | None = None
    direction: Direction | None = None
    original_payload: str | None = None
    sent_payload: str | None = None
    transformations: list[str] = Field(default_factory=list)
    pii_found: list[str] = Field(default_factory=list)
    policy_rule: str = ""
    original_preview: str = ""
    masked_preview: str = ""


class Agent(BaseModel):
    id: str
    name: str
    status: AgentStatus = "active"
    last_active: str
    privacy_score: int = 0
    permissions: dict[str, PermissionValue] = Field(default_factory=dict)
    oversight_mode: OversightMode = "flexible"


class Identity(BaseModel):
    id: str
    kind: IdentityKind
    alias: str
    used_by: list[str] = Field(default_factory=list)
    status: IdentityStatus = "active"
    scope: str | None = None
    expires_at: str | None = None
    use_count: int = 0


class Approval(BaseModel):
    id: str
    agent: str
    app: str
    action: str
    details: str
    data_to_release: list[str] = Field(default_factory=list)
    status: ApprovalStatus = "pending"
    created_at: str
    expires_at: str | None = None


class Token(BaseModel):
    """A scoped access token (real value is never returned in full)."""

    id: str
    label: str
    value: str  # masked/revealed value; the real secret lives in the vault
    scopes: list[str] = Field(default_factory=list)
    status: TokenStatus = "active"
    created_at: str
    last_used: str | None = None
    expires_at: str | None = None


class Handoff(BaseModel):
    """An agent-to-agent handoff of a task/context."""

    id: str
    from_agent: str
    to_agent: str
    context: str
    status: HandoffStatus = "pending"
    created_at: str


class MetadataRule(BaseModel):
    """A per-agent field-level metadata handling rule."""

    id: str
    agent: str
    field: str
    action: MetadataAction
    created_at: str


class OversightConfig(BaseModel):
    """Oversight mode, either global or scoped to a single agent."""

    agent_id: str | None = None  # None => global override
    mode: OversightMode
    updated_at: str


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


class OversightSet(BaseModel):
    mode: OversightMode
    agent_id: str | None = None


class HandoffCreate(BaseModel):
    from_agent: str
    to_agent: str
    context: str


class MetadataRuleCreate(BaseModel):
    agent: str
    field: str
    action: MetadataAction
