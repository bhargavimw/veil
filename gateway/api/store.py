"""In-memory backing store for the VEIL dashboard API.

Seeded with obviously-fake data that mirrors the frontend
``dashboard/src/dashboard/mockData.ts`` (4 agents, 40 events, identities,
approvals) plus the new token/handoff/metadata-rule seed rows. This store is
the swap-in point for the real engine modules once they move out of stub
status.

Events are fanned out to subscribers through an asyncio pub/sub bus so any
number of WebSocket clients receive new ``VeilEvent``s as they occur.
"""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime, timedelta

from gateway.api.models import (
    Agent,
    AgentStatus,
    Approval,
    ApprovalStatus,
    Handoff,
    Identity,
    IdentityKind,
    MetadataAction,
    MetadataRule,
    OversightConfig,
    OversightMode,
    PermissionValue,
    Status,
    Token,
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
        "oversight_mode": "flexible",
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
        "oversight_mode": "restricted",
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
        "oversight_mode": "flexible",
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
        "oversight_mode": "unrestricted",
    },
}

_SEED_IDENTITIES: list[dict] = [
    {
        "id": "id-email-shop",
        "kind": "email",
        "alias": "aarav.shop@veil.alias",
        "used_by": ["Shopper-Bot"],
        "status": "active",
        "scope": "store.checkout",
        "expires_at": None,
        "use_count": 12,
    },
    {
        "id": "id-email-assist",
        "kind": "email",
        "alias": "aarav.mail@veil.alias",
        "used_by": ["Assistant-1"],
        "status": "active",
        "scope": "gmail.*",
        "expires_at": None,
        "use_count": 34,
    },
    {
        "id": "id-phone",
        "kind": "phone",
        "alias": "+91 00000 00000",
        "used_by": ["Shopper-Bot", "Assistant-1"],
        "status": "active",
        "scope": "sms.*",
        "expires_at": None,
        "use_count": 7,
    },
    {
        "id": "id-name",
        "kind": "name",
        "alias": "A. Sharma",
        "used_by": ["Assistant-1", "Planner"],
        "status": "active",
        "scope": "profile",
        "expires_at": None,
        "use_count": 41,
    },
    {
        "id": "id-address",
        "kind": "address",
        "alias": "12 Layer-2 Lane, Nebula Heights",
        "used_by": ["Shopper-Bot"],
        "status": "active",
        "scope": "shipping",
        "expires_at": None,
        "use_count": 9,
    },
    {
        "id": "id-card",
        "kind": "card",
        "alias": "****-****-****-4111",
        "used_by": ["Shopper-Bot"],
        "status": "active",
        "scope": "payments",
        "expires_at": None,
        "use_count": 3,
    },
    {
        "id": "id-username",
        "kind": "username",
        "alias": "aarav_bot",
        "used_by": ["unknown-agent"],
        "status": "revoked",
        "scope": "api.*",
        "expires_at": None,
        "use_count": 0,
    },
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
        "expires_at": None,
    },
]

_SEED_TOKENS: list[dict] = [
    {
        "id": "tok-gmail-ro",
        "label": "Gmail read-only",
        "value": "veil_live_abcdef123456",
        "scopes": ["gmail.read_inbox"],
        "status": "active",
        "created_at": "2026-01-10T00:00:00+00:00",
        "last_used": "2026-01-15T00:00:00+00:00",
        "expires_at": None,
    },
    {
        "id": "tok-store-pay",
        "label": "Store payments",
        "value": "veil_live_ghijkl789012",
        "scopes": ["store.checkout"],
        "status": "active",
        "created_at": "2026-01-12T00:00:00+00:00",
        "last_used": None,
        "expires_at": None,
    },
    {
        "id": "tok-drive-full",
        "label": "Drive full access (revoked)",
        "value": "veil_live_mnopqr345678",
        "scopes": ["drive.download_all"],
        "status": "revoked",
        "created_at": "2026-01-05T00:00:00+00:00",
        "last_used": "2026-01-06T00:00:00+00:00",
        "expires_at": None,
    },
]

_SEED_HANDOFFS: list[dict] = [
    {
        "id": "hf-1",
        "from_agent": "Shopper-Bot",
        "to_agent": "Assistant-1",
        "context": "Checkout payment confirmation",
        "status": "completed",
        "created_at": "2026-01-14T00:00:00+00:00",
    },
    {
        "id": "hf-2",
        "from_agent": "Planner",
        "to_agent": "Assistant-1",
        "context": "Calendar conflict resolution",
        "status": "pending",
        "created_at": "2026-01-15T00:00:00+00:00",
    },
    {
        "id": "hf-3",
        "from_agent": "unknown-agent",
        "to_agent": "Assistant-1",
        "context": "Bulk Drive export request",
        "status": "declined",
        "created_at": "2026-01-13T00:00:00+00:00",
    },
]

_SEED_METADATA_RULES: list[dict] = [
    {
        "id": "rule-1",
        "agent": "Assistant-1",
        "field": "email",
        "action": "mask",
        "created_at": "2026-01-08T00:00:00+00:00",
    },
    {
        "id": "rule-2",
        "agent": "Shopper-Bot",
        "field": "card",
        "action": "redact",
        "created_at": "2026-01-09T00:00:00+00:00",
    },
    {
        "id": "rule-3",
        "agent": "Planner",
        "field": "address",
        "action": "allow",
        "created_at": "2026-01-10T00:00:00+00:00",
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
                "destination": "gmail",
                "direction": "inbound",
                "original_payload": "Hi Aarav Sharma, receipt for aarav@gmail.com, call +91 98765 43210",
                "sent_payload": "Hi [NAME_1], receipt for [EMAIL_1], call [PHONE_1]",
                "transformations": ["mask:name", "mask:email", "mask:phone"],
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
                "destination": "store",
                "direction": "outbound",
                "original_payload": "Checkout for order #4111 using saved card 4111 1111 1111 1111",
                "sent_payload": "Checkout for order #4111 using saved card [CARD_1]",
                "transformations": ["mask:card"],
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
                "destination": "calendar",
                "direction": "inbound",
                "original_payload": "Dentist Tue 3pm, Dr. Rao, Room 4B",
                "sent_payload": "Busy: Tuesday 15:00-16:00",
                "transformations": ["data_minimization:free_busy_only"],
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
                "destination": "drive",
                "direction": "outbound",
                "original_payload": "Bulk download of all Drive files",
                "sent_payload": None,
                "transformations": [],
                "pii_found": [],
                "policy_rule": "Deny: unlisted agent, fail closed",
                "original_preview": "Bulk download of all Drive files",
                "masked_preview": "—",
            })
    return rows


class MemoryStore:
    """Holds agents, identities, approvals, tokens, handoffs, metadata rules
    and events; fans events out to subscribers through an asyncio pub/sub bus."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self.agents: dict[str, Agent] = {
            aid: Agent(id=aid, **data) for aid, data in _SEED_AGENTS.items()
        }
        self.identities: list[Identity] = [Identity(**data) for data in _SEED_IDENTITIES]
        self.approvals: list[Approval] = [Approval(**data) for data in _SEED_APPROVALS]
        self.tokens: list[Token] = [Token(**data) for data in _SEED_TOKENS]
        self.handoffs: list[Handoff] = [Handoff(**data) for data in _SEED_HANDOFFS]
        self.metadata_rules: list[MetadataRule] = [
            MetadataRule(**data) for data in _SEED_METADATA_RULES
        ]
        self.events: list[VeilEvent] = [VeilEvent(**data) for data in _seed_events()]
        self.kill_switch_on = False
        self.oversight: OversightConfig = OversightConfig(
            agent_id=None, mode="flexible", updated_at=_now()
        )
        self._subscribers: set[asyncio.Queue[VeilEvent]] = set()
        self._seq = len(self.events)

    # ------------------------------------------------------------------
    # Event bus (asyncio pub/sub)
    # ------------------------------------------------------------------

    def subscribe(self) -> asyncio.Queue[VeilEvent]:
        """Register a subscriber and return its event queue."""
        queue: asyncio.Queue[VeilEvent] = asyncio.Queue(maxsize=1000)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[VeilEvent]) -> None:
        """Remove a subscriber queue."""
        self._subscribers.discard(queue)

    async def broadcast(self, event: VeilEvent) -> None:
        """Publish ``event`` to every subscriber queue (non-blocking drop)."""
        dead: list[asyncio.Queue[VeilEvent]] = []
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                dead.append(queue)
        for queue in dead:
            self._subscribers.discard(queue)

    async def emit(self, **fields) -> VeilEvent:
        """Create, store and broadcast a new event."""
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

    def list_events(
        self,
        limit: int = 50,
        agent: str | None = None,
        app: str | None = None,
        status: str | None = None,
    ) -> list[VeilEvent]:
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

    def list_tokens(self) -> list[Token]:
        return list(self.tokens)

    def list_handoffs(self) -> list[Handoff]:
        return list(self.handoffs)

    def list_metadata_rules(self) -> list[MetadataRule]:
        return list(self.metadata_rules)

    def list_logs(self, limit: int = 100) -> list[VeilEvent]:
        """Alias for events; kept as the audit-log listing endpoint."""
        return self.list_events(limit=limit)

    def export_logs_jsonl(self) -> str:
        """Return all events as newline-delimited JSON (.jsonl)."""
        lines = [event.model_dump_json() for event in self.events]
        return "\n".join(lines) + ("\n" if lines else "")

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

    async def patch_permission(
        self, agent_id: str, key: str, value: PermissionValue
    ) -> Agent | None:
        async with self._lock:
            agent = self.agents.get(agent_id)
            if agent is None:
                return None
            agent.permissions[key] = value
        created: list[VeilEvent] = []
        if value == "deny" and key == "drive.download_all":
            created.append(
                await self.emit(
                    agent=agent.name,
                    app="Drive",
                    tool="drive.download_all",
                    status="blocked",
                    pii_found=[],
                    policy_rule="Agent rule: deny drive.download_all",
                    original_preview="Bulk download of all Drive files",
                    masked_preview="—",
                )
            )
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
            "username": "veil_user",
            "address": "88 Cloak Way, Puffin City",
            "card": "****-****-****-4111",
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
            target: Approval | None = None
            for apr in self.approvals:
                if apr.id == approval_id:
                    apr.status = decision
                    target = apr
                    break
            if target is None:
                return None
        if decision == "approved":
            await self.emit(
                agent=target.agent,
                app=target.app,
                tool=target.action,
                status="allowed",
                pii_found=[],
                policy_rule="User approved: release alias data only",
                original_preview=target.details,
                masked_preview="Released alias only — real address never shared",
            )
        else:
            await self.emit(
                agent=target.agent,
                app=target.app,
                tool=target.action,
                status="blocked",
                pii_found=[],
                policy_rule="User denied: request cancelled",
                original_preview=target.details,
                masked_preview="—",
            )
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
            created.append(
                await self.emit(
                    agent="Assistant-1",
                    app="Gmail",
                    tool="gmail.read_inbox",
                    status=status,
                    destination="gmail",
                    direction="inbound",
                    original_payload="Hi Aarav, your card is 4111 1111 1111 1111, phone 9876543210, OTP 419332.",
                    sent_payload="Hi [NAME_1], your card is [CARD_1], phone [PHONE_1], OTP [OTP_1].",
                    transformations=["mask:name", "mask:card", "mask:phone", "mask:otp"],
                    pii_found=["name", "card", "phone", "otp"],
                    policy_rule="PII filter: mask name, card, phone, OTP",
                    original_preview="Hi Aarav, your card is 4111 1111 1111 1111, phone 9876543210, OTP 419332.",
                    masked_preview="Hi [NAME_1], your card is [CARD_1], phone [PHONE_1], OTP [OTP_1].",
                )
            )
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
            created.append(
                await self.emit(
                    agent="Shopper-Bot",
                    app="Store",
                    tool="store.checkout",
                    status="approval_needed",
                    destination="store",
                    direction="outbound",
                    original_payload="Ship to 42 Real Street, Springfield. Pay with saved card.",
                    sent_payload=None,
                    transformations=[],
                    pii_found=["address"],
                    policy_rule="store.checkout requires approval (Ask)",
                    original_preview="Ship to 42 Real Street, Springfield. Pay with saved card.",
                    masked_preview="Awaiting your approval — nothing released yet.",
                )
            )
        elif scenario == "blocked":
            created.append(
                await self.emit(
                    agent="Unknown-Agent",
                    app="Drive",
                    tool="drive.download_all",
                    status=self.compute_status("unknown-agent", "drive.download_all"),
                    destination="drive",
                    direction="outbound",
                    original_payload="Bulk download of all Drive files",
                    sent_payload=None,
                    transformations=[],
                    pii_found=[],
                    policy_rule="Deny: unlisted agent, fail closed",
                    original_preview="Bulk download of all Drive files",
                    masked_preview="—",
                )
            )

        return {"emitted": [e.model_dump() for e in created], "approval_id": approval_id}

    # ------------------------------------------------------------------
    # Tokens
    # ------------------------------------------------------------------

    async def reveal_token(self, token_id: str) -> Token | None:
        """Return the token record (real value lives in the vault; here it
        is the masked/revealed representation)."""
        for token in self.tokens:
            if token.id == token_id:
                return token
        return None

    async def revoke_token(self, token_id: str) -> bool:
        for token in self.tokens:
            if token.id == token_id:
                token.status = "revoked"
                return True
        return False

    # ------------------------------------------------------------------
    # Handoffs
    # ------------------------------------------------------------------

    async def create_handoff(self, from_agent: str, to_agent: str, context: str) -> Handoff:
        self._seq += 1
        handoff = Handoff(
            id=f"hf-{self._seq}",
            from_agent=from_agent,
            to_agent=to_agent,
            context=context,
            status="pending",
            created_at=_now(),
        )
        self.handoffs.insert(0, handoff)
        return handoff

    # ------------------------------------------------------------------
    # Metadata rules
    # ------------------------------------------------------------------

    async def create_metadata_rule(
        self, agent: str, field: str, action: MetadataAction
    ) -> MetadataRule:
        self._seq += 1
        rule = MetadataRule(
            id=f"rule-{self._seq}",
            agent=agent,
            field=field,
            action=action,
            created_at=_now(),
        )
        self.metadata_rules.insert(0, rule)
        return rule

    # ------------------------------------------------------------------
    # Oversight
    # ------------------------------------------------------------------

    def get_oversight(self, agent_id: str | None = None) -> OversightConfig:
        """Return per-agent override if present, else the global config."""
        if agent_id is not None and agent_id in self.agents:
            # Per-agent overrides are stored as agent.oversight_mode; expose
            # them through the same config shape.
            return OversightConfig(
                agent_id=agent_id,
                mode=self.agents[agent_id].oversight_mode,
                updated_at=self.agents[agent_id].last_active,
            )
        return self.oversight

    async def set_oversight(self, mode: OversightMode, agent_id: str | None = None) -> OversightConfig:
        if agent_id is not None:
            agent = self.agents.get(agent_id)
            if agent is None:
                raise KeyError("agent not found")
            agent.oversight_mode = mode
            return OversightConfig(
                agent_id=agent_id, mode=mode, updated_at=_now()
            )
        self.oversight = OversightConfig(agent_id=None, mode=mode, updated_at=_now())
        return self.oversight
