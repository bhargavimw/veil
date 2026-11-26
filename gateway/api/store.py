"""In-memory backing store for the VEIL dashboard API.

Seeded with the same obviously-fake data as the frontend
``dashboard/src/dashboard/mockData.ts`` so the live backend and the
mock mode tell the same story. This store is the swap-in point for the
audit/identity/policy modules once they move out of stub status.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta

from gateway.api.models import (
    Agent,
    AgentStatus,
    Approval,
    ApprovalStatus,
    Identity,
    IdentityKind,
    PermissionValue,
    Status,
    VeilEvent,
)


def _now() -> str:
    return datetime.now(UTC).isoformat()


# ---------------------------------------------------------------------------
# Seed data (mirrors dashboard/src/dashboard/mockData.ts)
# ---------------------------------------------------------------------------

_SEED_AGENTS: dict[str, dict] = {
    "assistant-1": {
        "name": "Assistant-1",
        "status": "active",
        "last_active": "just now",
        "privacy_score": 96,
        "permissions": {
            "gmail.read_inbox": "mask",
            "gmail.send_email": "ask",
            "calendar.read_events": "allow",
            "drive.download_all": "deny",
            "store.checkout": "ask",
        },
    },
    "shopper-bot": {
        "name": "Shopper-Bot",
        "status": "active",
        "last_active": "2 min ago",
        "privacy_score": 91,
        "permissions": {
            "gmail.read_inbox": "deny",
            "gmail.send_email": "deny",
            "calendar.read_events": "deny",
            "drive.download_all": "deny",
            "store.checkout": "ask",
        },
    },
    "planner": {
        "name": "Planner",
        "status": "active",
        "last_active": "8 min ago",
        "privacy_score": 94,
        "permissions": {
            "gmail.read_inbox": "deny",
            "gmail.send_email": "deny",
            "calendar.read_events": "allow",
            "drive.download_all": "mask",
            "store.checkout": "deny",
        },
    },
    "unknown-agent": {
        "name": "Unknown-Agent",
        "status": "active",
        "last_active": "yesterday",
        "privacy_score": 40,
        "permissions": {
            "gmail.read_inbox": "deny",
            "gmail.send_email": "deny",
            "calendar.read_events": "deny",
            "drive.download_all": "deny",
            "store.checkout": "deny",
        },
    },
}

_SEED_IDENTITIES: list[dict] = [
    {"id": "id-email-shop", "kind": "email", "alias": "aarav.shop@veil.alias", "used_by": ["Shopper-Bot"], "status": "active"},
    {"id": "id-email-assist", "kind": "email", "alias": "aarav.mail@veil.alias", "used_by": ["Assistant-1"], "status": "active"},
    {"id": "id-phone", "kind": "phone", "alias": "+91 00000 00000", "used_by": ["Shopper-Bot", "Assistant-1"], "status": "active"},
    {"id": "id-name", "kind": "name", "alias": "A. Sharma", "used_by": ["Assistant-1", "Planner"], "status": "active"},
    {"id": "id-address", "kind": "address", "alias": "12 Layer-2 Lane, Nebula Heights", "used_by": ["Shopper-Bot"], "status": "active"},
]

_SEED_APPROVALS: list[dict] = [
    {
        "id": "apr-seed-1",
        "agent": "Assistant-1",
        "app": "Gmail",
        "action": "send_email",
        "details": "Forward invoice to accountant@example.com",
        "data_to_release": ["message body", "recipient address"],
        "status": "pending",
        "created_at": "2026-01-01T00:00:00+00:00",
    },
]


def _seed_events() -> list[dict]:
    """40 past events across the 4 agents and 4 apps (mirrors mockData.seedEvents)."""
    agents = ["Assistant-1", "Shopper-Bot", "Planner", "Unknown-Agent"]
    now = datetime.now(UTC)
    rows: list[dict] = []
    for i in range(40):
        agent = agents[i % 4]
        mins_ago = 47 + i * 23 + ((i * 7) % 13)
        timestamp = (now - timedelta(minutes=mins_ago)).isoformat()
        n = i % 4
        if n == 0:
            rows.append({
                "id": f"ev-seed-{i}",
                "timestamp": timestamp,
                "agent": agent,
                "app": "Gmail",
                "tool": "gmail.read_inbox",
                "status": "masked",
                "pii_found": ["name", "email", "phone"],
                "policy_rule": "PII filter: mask names, emails, phones",
                "original_preview": "Hi Aarav Sharma, receipt for aarav@gmail.com, call +91 98765 43210",
                "masked_preview": "Hi [NAME_1], receipt for [EMAIL_1], call [PHONE_1]",
            })
        elif n == 1:
            rows.append({
                "id": f"ev-seed-{i}",
                "timestamp": timestamp,
                "agent": agent,
                "app": "Store",
                "tool": "store.checkout",
                "status": "allowed",
                "pii_found": [],
                "policy_rule": "Alias identity: use aarav.shop@veil.alias",
                "original_preview": "Checkout for order #4111 using saved card 4111 1111 1111 1111",
                "masked_preview": "Checkout for order #4111 using saved card [CARD_1]",
            })
        elif n == 2:
            rows.append({
                "id": f"ev-seed-{i}",
                "timestamp": timestamp,
                "agent": agent,
                "app": "Calendar",
                "tool": "calendar.read_events",
                "status": "allowed",
                "pii_found": [],
                "policy_rule": "Free/busy only",
                "original_preview": "Dentist Tue 3pm, Dr. Rao, Room 4B",
                "masked_preview": "Busy: Tuesday 15:00-16:00",
            })
        else:
            rows.append({
                "id": f"ev-seed-{i}",
                "timestamp": timestamp,
                "agent": "Unknown-Agent",
                "app": "Drive",
                "tool": "drive.download_all",
                "status": "blocked",
                "pii_found": [],
                "policy_rule": "Deny: unlisted agent, fail closed",
                "original_preview": "Bulk download of all Drive files",
                "masked_preview": "—",
            })
    return rows


class MemoryStore:
    """Holds agents, identities, approvals and events; fans events out to WS clients."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self.agents: dict[str, Agent] = {
            aid: Agent(id=aid, **data) for aid, data in _SEED_AGENTS.items()
        }
        self.identities: list[Identity] = [Identity(**data) for data in _SEED_IDENTITIES]
        self.approvals: list[Approval] = [Approval(**data) for data in _SEED_APPROVALS]
        self.events: list[VeilEvent] = [VeilEvent(**data) for data in _seed_events()]
        self.kill_switch_on = False
        self._ws_clients: set = set()
        self._seq = len(self.events)

    # ------------------------------------------------------------------
    # Event bus
    # ------------------------------------------------------------------

    def subscribe(self, ws) -> None:
        self._ws_clients.add(ws)

    def unsubscribe(self, ws) -> None:
        self._ws_clients.discard(ws)

    async def broadcast(self, event: VeilEvent) -> None:
        payload = event.model_dump_json()
        dead: list = []
        for ws in list(self._ws_clients):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self._ws_clients.discard(ws)

    async def emit(self, **fields) -> VeilEvent:
        self._seq += 1
        fields.setdefault("id", f"ev-{self._seq}")
        fields.setdefault("timestamp", _now())
        event = VeilEvent(**fields)
        async with self._lock:
            self.events.insert(0, event)
            self.events = self.events[:300]
        await self.broadcast(event)
        return event

    # ------------------------------------------------------------------
    # Reads
    # ------------------------------------------------------------------

    def list_events(self, limit: int = 50, agent: str | None = None, app: str | None = None,
                    status: str | None = None) -> list[VeilEvent]:
        result = self.events
        if agent:
            result = [e for e in result if e.agent == agent]
        if app:
            result = [e for e in result if e.app == app]
        if status:
            result = [e for e in result if e.status == status]
        return result[:limit]

    def list_agents(self) -> list[Agent]:
        return list(self.agents.values())

    def list_identities(self) -> list[Identity]:
        return list(self.identities)

    def list_approvals(self) -> list[Approval]:
        return list(self.approvals)

    # ------------------------------------------------------------------
    # Status helpers
    # ------------------------------------------------------------------

    def compute_status(self, agent_id: str, tool: str) -> Status:
        """Decision for a fresh request, honouring permissions and kill switch."""
        if self.kill_switch_on:
            return "blocked"
        agent = self.agents.get(agent_id)
        if agent is None or agent.status != "active":
            return "blocked"
        perm: PermissionValue | None = agent.permissions.get(tool)
        if perm == "deny":
            return "blocked"
        if perm == "ask":
            return "approval_needed"
        if perm == "mask":
            return "masked"
        if perm == "allow":
            return "allowed"
        if tool == "store.checkout":
            return "approval_needed"
        if tool.startswith("gmail."):
            return "masked"
        return "allowed"

    # ------------------------------------------------------------------
    # Writes
    # ------------------------------------------------------------------

    async def patch_permission(self, agent_id: str, key: str, value: PermissionValue) -> Agent | None:
        async with self._lock:
            agent = self.agents.get(agent_id)
            if agent is None:
                return None
            agent.permissions[key] = value
        created: list[VeilEvent] = []
        if value == "deny" and key == "drive.download_all":
            created.append(await self.emit(
                agent=agent.name, app="Drive", tool="drive.download_all",
                status="blocked", pii_found=[],
                policy_rule="Agent rule: deny drive.download_all",
                original_preview="Bulk download of all Drive files",
                masked_preview="—",
            ))
        return agent

    async def set_agent_status(self, agent_id: str, status: AgentStatus) -> Agent | None:
        async with self._lock:
            agent = self.agents.get(agent_id)
            if agent is None:
                return None
            agent.status = status
            agent.last_active = "just now"
        return agent

    async def create_identity(self, kind: IdentityKind) -> Identity:
        aliases: dict[IdentityKind, str] = {
            "email": "alias.mail@veil.alias",
            "phone": "+91 00000 11111",
            "name": "R. Person",
            "address": "88 Cloak Way, Puffin City",
        }
        async with self._lock:
            ident = Identity(
                id=f"id-{self._seq}",
                kind=kind,
                alias=aliases[kind],
                used_by=[],
                status="active",
            )
            self.identities.insert(0, ident)
            self._seq += 1
        return ident

    async def revoke_identity(self, ident_id: str) -> bool:
        async with self._lock:
            for ident in self.identities:
                if ident.id == ident_id:
                    ident.status = "revoked"
                    return True
        return False

    async def decide_approval(self, approval_id: str, decision: ApprovalStatus) -> Approval | None:
        async with self._lock:
            for apr in self.approvals:
                if apr.id == approval_id:
                    apr.status = decision
                    target = apr
                    break
            else:
                return None
        created: list[VeilEvent] = []
        if target is not None:
            if decision == "approved":
                created.append(await self.emit(
                    agent=target.agent, app=target.app, tool=target.action,
                    status="allowed", pii_found=[],
                    policy_rule="User approved: release alias data only",
                    original_preview=target.details,
                    masked_preview="Released alias only — real address never shared",
                ))
            else:
                created.append(await self.emit(
                    agent=target.agent, app=target.app, tool=target.action,
                    status="blocked", pii_found=[],
                    policy_rule="User denied: request cancelled",
                    original_preview=target.details,
                    masked_preview="—",
                ))
        return target

    async def kill_switch(self, on: bool) -> None:
        async with self._lock:
            self.kill_switch_on = on
            if on:
                for agent in self.agents.values():
                    if agent.status != "revoked":
                        agent.status = "paused"
            else:
                for agent in self.agents.values():
                    if agent.status == "paused":
                        agent.status = "active"

    async def demo_trigger(self, scenario: str) -> dict:
        """Emit realistic demo events; the ``approval`` scenario also
        creates a pending approval whose decision emits an outcome event."""
        if self.kill_switch_on:
            return {"emitted": [], "reason": "kill switch on"}

        created: list[VeilEvent] = []
        approval_id: str | None = None

        if scenario == "masked_inbox":
            status = self.compute_status("assistant-1", "gmail.read_inbox")
            created.append(await self.emit(
                agent="Assistant-1", app="Gmail", tool="gmail.read_inbox",
                status=status,
                pii_found=["name", "card", "phone", "otp"],
                policy_rule="PII filter: mask name, card, phone, OTP",
                original_preview="Hi Aarav, your card is 4111 1111 1111 1111, phone 9876543210, OTP 419332.",
                masked_preview="Hi [NAME_1], your card is [CARD_1], phone [PHONE_1], OTP [OTP_1].",
            ))
        elif scenario == "approval":
            self._seq += 1
            approval_id = f"apr-demo-{self._seq}"
            approval = Approval(
                id=approval_id,
                agent="Shopper-Bot",
                app="Store",
                action="store.checkout",
                details="Complete checkout for order #9842 with saved payment alias",
                data_to_release=["alias address only"],
                status="pending",
                created_at=_now(),
            )
            async with self._lock:
                self.approvals.insert(0, approval)
            created.append(await self.emit(
                agent="Shopper-Bot", app="Store", tool="store.checkout",
                status="approval_needed", pii_found=["address"],
                policy_rule="store.checkout requires approval (Ask)",
                original_preview="Ship to 42 Real Street, Springfield. Pay with saved card.",
                masked_preview="Awaiting your approval — nothing released yet.",
            ))
        elif scenario == "blocked":
            created.append(await self.emit(
                agent="Unknown-Agent", app="Drive", tool="drive.download_all",
                status=self.compute_status("unknown-agent", "drive.download_all"),
                pii_found=[], policy_rule="Deny: unlisted agent, fail closed",
                original_preview="Bulk download of all Drive files",
                masked_preview="—",
            ))

        return {"emitted": [e.model_dump() for e in created], "approval_id": approval_id}
