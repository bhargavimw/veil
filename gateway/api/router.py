"""REST + WebSocket API for the VEIL dashboard (contract in AGENTS.md section 4,
plus the live-gateway additions: oversight, tokens, handoffs, metadata rules,
logs export and WS event broadcast).

Mounted on the FastAPI app with prefix ``/api``. CORS origins come from the
``VEIL_CORS_ORIGINS`` env var (comma-separated). All bodies are validated with
Pydantic.
"""

from __future__ import annotations

import os

from fastapi import (
    APIRouter,
    FastAPI,
    HTTPException,
    Query,
    status,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from gateway.api.models import (
    Agent,
    AgentStatusBody,
    Approval,
    ApprovalDecision,
    ApprovalStatus,
    DemoTrigger,
    Handoff,
    HandoffCreate,
    Identity,
    IdentityCreate,
    KillSwitchBody,
    MetadataRule,
    MetadataRuleCreate,
    OversightConfig,
    OversightSet,
    PermissionPatch,
    Status,
    Token,
    VeilEvent,
)
from gateway.api.store import MemoryStore

router = APIRouter(prefix="/api")
store = MemoryStore()


def cors_origins() -> list[str]:
    raw = os.environ.get("VEIL_CORS_ORIGINS")
    if raw:
        return [origin.strip() for origin in raw.split(",") if origin.strip()]
    return ["http://localhost:5173"]


def install(app: FastAPI) -> None:
    """Add CORS and mount the API router on ``app``."""
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@router.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------


@router.get("/events", response_model=list[VeilEvent])
async def list_events(
    limit: int = Query(50, ge=1, le=500),
    agent: str | None = None,
    app: str | None = None,
    status: Status | None = None,
) -> list[VeilEvent]:
    return store.list_events(limit=limit, agent=agent, app=app, status=status)


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------


@router.get("/agents", response_model=list[Agent])
async def list_agents() -> list[Agent]:
    return store.list_agents()


@router.patch("/agents/{agent_id}/permissions")
async def patch_permission(agent_id: str, body: PermissionPatch) -> dict:
    agent = await store.patch_permission(agent_id, body.key, body.value)
    if agent is None:
        raise HTTPException(status_code=404, detail="agent not found")
    return {"agent": agent_id, "key": body.key, "value": body.value}


@router.post("/agents/{agent_id}/status")
async def set_agent_status(agent_id: str, body: AgentStatusBody) -> dict:
    agent = await store.set_agent_status(agent_id, body.status)
    if agent is None:
        raise HTTPException(status_code=404, detail="agent not found")
    return {"agent": agent_id, "status": agent.status, "last_active": agent.last_active}


@router.get("/agents/{agent_id}/oversight", response_model=OversightConfig)
async def get_agent_oversight(agent_id: str) -> OversightConfig:
    if agent_id not in store.agents:
        raise HTTPException(status_code=404, detail="agent not found")
    return store.get_oversight(agent_id)


@router.post("/agents/{agent_id}/oversight", response_model=OversightConfig)
async def set_agent_oversight(agent_id: str, body: OversightSet) -> OversightConfig:
    if agent_id not in store.agents:
        raise HTTPException(status_code=404, detail="agent not found")
    return await store.set_oversight(body.mode, agent_id)


# ---------------------------------------------------------------------------
# Identities
# ---------------------------------------------------------------------------


@router.get("/identities", response_model=list[Identity])
async def list_identities() -> list[Identity]:
    return store.list_identities()


@router.post("/identities", response_model=Identity)
async def create_identity(body: IdentityCreate) -> Identity:
    return await store.create_identity(body.kind)


@router.post("/identities/{ident_id}/revoke")
async def revoke_identity(ident_id: str) -> dict:
    ok = await store.revoke_identity(ident_id)
    if not ok:
        raise HTTPException(status_code=404, detail="identity not found")
    return {"id": ident_id, "status": "revoked"}


# ---------------------------------------------------------------------------
# Approvals
# ---------------------------------------------------------------------------


@router.get("/approvals", response_model=list[Approval])
async def list_approvals() -> list[Approval]:
    return store.list_approvals()


@router.post("/approvals/{approval_id}/decision")
async def decide_approval(approval_id: str, body: ApprovalDecision) -> dict:
    decision: ApprovalStatus = body.decision
    approval = await store.decide_approval(approval_id, decision)
    if approval is None:
        raise HTTPException(status_code=404, detail="approval not found")
    return {"id": approval_id, "status": approval.status}


# ---------------------------------------------------------------------------
# Kill switch
# ---------------------------------------------------------------------------


@router.post("/kill-switch")
async def kill_switch(body: KillSwitchBody) -> dict:
    await store.kill_switch(body.on)
    return {"on": body.on}


# ---------------------------------------------------------------------------
# Demo trigger
# ---------------------------------------------------------------------------


@router.post("/demo/trigger")
async def demo_trigger(body: DemoTrigger) -> dict:
    return await store.demo_trigger(body.scenario)


# ---------------------------------------------------------------------------
# Oversight (global)
# ---------------------------------------------------------------------------


@router.get("/oversight", response_model=OversightConfig)
async def get_oversight() -> OversightConfig:
    return store.get_oversight()


@router.post("/oversight", response_model=OversightConfig)
async def set_oversight(body: OversightSet) -> OversightConfig:
    return await store.set_oversight(body.mode, body.agent_id)


# ---------------------------------------------------------------------------
# Tokens
# ---------------------------------------------------------------------------


@router.get("/tokens", response_model=list[Token])
async def list_tokens() -> list[Token]:
    return store.list_tokens()


@router.post("/tokens/{token_id}/reveal", response_model=Token)
async def reveal_token(token_id: str) -> Token:
    token = await store.reveal_token(token_id)
    if token is None:
        raise HTTPException(status_code=404, detail="token not found")
    return token


@router.post("/tokens/{token_id}/revoke")
async def revoke_token(token_id: str) -> dict:
    ok = await store.revoke_token(token_id)
    if not ok:
        raise HTTPException(status_code=404, detail="token not found")
    return {"id": token_id, "status": "revoked"}


# ---------------------------------------------------------------------------
# Handoffs
# ---------------------------------------------------------------------------


@router.get("/handoffs", response_model=list[Handoff])
async def list_handoffs() -> list[Handoff]:
    return store.list_handoffs()


@router.post("/handoffs", response_model=Handoff, status_code=status.HTTP_201_CREATED)
async def create_handoff(body: HandoffCreate) -> Handoff:
    known = set(store.agents.keys()) | {a.name for a in store.agents.values()}
    if body.from_agent not in known or body.to_agent not in known:
        raise HTTPException(status_code=404, detail="agent not found")
    return await store.create_handoff(body.from_agent, body.to_agent, body.context)


# ---------------------------------------------------------------------------
# Metadata rules
# ---------------------------------------------------------------------------


@router.get("/metadata-rules", response_model=list[MetadataRule])
async def list_metadata_rules() -> list[MetadataRule]:
    return store.list_metadata_rules()


@router.post(
    "/metadata-rules",
    response_model=MetadataRule,
    status_code=status.HTTP_201_CREATED,
)
async def create_metadata_rule(body: MetadataRuleCreate) -> MetadataRule:
    return await store.create_metadata_rule(body.agent, body.field, body.action)


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------


@router.get("/logs", response_model=list[VeilEvent])
async def list_logs(limit: int = Query(100, ge=1, le=1000)) -> list[VeilEvent]:
    return store.list_logs(limit=limit)


@router.get("/logs/export", response_class=PlainTextResponse)
async def export_logs() -> str:
    """Return all audit events as newline-delimited JSON (.jsonl)."""
    return store.export_logs_jsonl()
