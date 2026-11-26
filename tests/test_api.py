"""Contract tests for the VEIL live API (AGENTS.md section 4 + additions).

Uses a fresh in-memory ``MemoryStore`` per test (monkeypatched into both the
router and ``main``) so tests are fully isolated. Covers response shape per
endpoint, WebSocket delivery after ``/api/demo/trigger``, and the kill
switch blocking new events.
"""

from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

import gateway.api.router as router_mod
import gateway.main as main_mod

EVENT_FIELDS = {
    "id", "timestamp", "agent", "app", "tool", "status",
    "destination", "direction", "original_payload", "sent_payload",
    "transformations", "pii_found", "policy_rule",
    "original_preview", "masked_preview",
}
AGENT_FIELDS = {
    "id", "name", "status", "last_active", "privacy_score",
    "permissions", "oversight_mode",
}
IDENTITY_FIELDS = {
    "id", "kind", "alias", "used_by", "status", "scope",
    "expires_at", "use_count",
}
APPROVAL_FIELDS = {
    "id", "agent", "app", "action", "details", "data_to_release",
    "status", "created_at", "expires_at",
}
STATUSES = {"allowed", "masked", "approval_needed", "blocked"}
IDENTITY_KINDS = {"email", "phone", "name", "username", "address", "card"}


@pytest.fixture
def store(monkeypatch: pytest.MonkeyPatch) -> router_mod.MemoryStore:
    fresh = router_mod.MemoryStore()
    monkeypatch.setattr(router_mod, "store", fresh)
    monkeypatch.setattr(main_mod, "store", fresh)
    return fresh


@pytest.fixture
def client(store: router_mod.MemoryStore) -> TestClient:
    return TestClient(main_mod.app)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


def test_health(client: TestClient) -> None:
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_root_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# Events
# ---------------------------------------------------------------------------


def test_events_shape(client: TestClient) -> None:
    r = client.get("/api/events?limit=3")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) <= 3
    for ev in data:
        assert EVENT_FIELDS <= set(ev.keys()), ev.keys()
        assert ev["status"] in STATUSES


def test_events_filtering(client: TestClient) -> None:
    r = client.get("/api/events?agent=Unknown-Agent&status=blocked&limit=10")
    assert r.status_code == 200
    data = r.json()
    assert all(e["agent"] == "Unknown-Agent" and e["status"] == "blocked" for e in data)


# ---------------------------------------------------------------------------
# Agents
# ---------------------------------------------------------------------------


def test_agents_shape(client: TestClient) -> None:
    r = client.get("/api/agents")
    assert r.status_code == 200
    agents = r.json()
    assert len(agents) == 4
    for a in agents:
        assert AGENT_FIELDS <= set(a.keys())
        assert a["status"] in {"active", "paused", "revoked"}
        assert a["oversight_mode"] in {"restricted", "flexible", "unrestricted"}
        for v in a["permissions"].values():
            assert v in {"allow", "mask", "ask", "deny"}


def test_permission_change_affects_outcome(client: TestClient) -> None:
    # Deny Gmail reads for Assistant-1 -> masked_inbox demo becomes blocked.
    r = client.patch(
        "/api/agents/assistant-1/permissions",
        json={"key": "gmail.read_inbox", "value": "deny"},
    )
    assert r.status_code == 200
    r = client.post("/api/demo/trigger", json={"scenario": "masked_inbox"})
    assert r.status_code == 200
    statuses = [e["status"] for e in r.json()["emitted"]]
    assert statuses == ["blocked"], statuses

    # Restore -> masked again.
    client.patch(
        "/api/agents/assistant-1/permissions",
        json={"key": "gmail.read_inbox", "value": "mask"},
    )
    r = client.post("/api/demo/trigger", json={"scenario": "masked_inbox"})
    statuses = [e["status"] for e in r.json()["emitted"]]
    assert statuses == ["masked"], statuses


def test_agent_status(client: TestClient) -> None:
    r = client.post(
        "/api/agents/planner/status", json={"status": "paused"}
    )
    assert r.status_code == 200
    assert r.json()["status"] == "paused"

    r = client.get("/api/agents")
    planner = next(a for a in r.json() if a["id"] == "planner")
    assert planner["status"] == "paused"


# ---------------------------------------------------------------------------
# Identities
# ---------------------------------------------------------------------------


def test_identities_shape(client: TestClient) -> None:
    r = client.get("/api/identities")
    assert r.status_code == 200
    idents = r.json()
    assert len(idents) == 7  # 6 seed + 1 revoked username
    for i in idents:
        assert IDENTITY_FIELDS <= set(i.keys())
        assert i["kind"] in IDENTITY_KINDS


def test_create_and_revoke_identity(client: TestClient) -> None:
    r = client.post("/api/identities", json={"kind": "username"})
    assert r.status_code == 200
    ident = r.json()
    assert ident["kind"] == "username" and ident["status"] == "active"

    r = client.post(f"/api/identities/{ident['id']}/revoke")
    assert r.status_code == 200
    assert r.json()["status"] == "revoked"

    r = client.get("/api/identities")
    assert any(i["id"] == ident["id"] and i["status"] == "revoked" for i in r.json())


# ---------------------------------------------------------------------------
# Approvals
# ---------------------------------------------------------------------------


def test_approvals_shape(client: TestClient) -> None:
    r = client.get("/api/approvals")
    assert r.status_code == 200
    ap = r.json()
    assert any(a["id"] == "apr-seed-1" and a["status"] == "pending" for a in ap)
    for a in ap:
        assert APPROVAL_FIELDS <= set(a.keys())


def test_approval_flow(client: TestClient) -> None:
    r = client.post("/api/demo/trigger", json={"scenario": "approval"})
    assert r.status_code == 200
    body = r.json()
    approval_id = body["approval_id"]
    assert approval_id is not None
    assert any(a["id"] == approval_id and a["status"] == "pending" for a in client.get("/api/approvals").json())

    r = client.post(f"/api/approvals/{approval_id}/decision", json={"decision": "approved"})
    assert r.status_code == 200
    assert r.json() == {"id": approval_id, "status": "approved"}
    assert any(a["id"] == approval_id and a["status"] == "approved" for a in client.get("/api/approvals").json())

    # The decision emits an allowed event.
    latest = client.get("/api/events?limit=1").json()[0]
    assert latest["status"] == "allowed"
    assert latest["agent"] == "Shopper-Bot"


def test_denied_approval_emits_blocked(client: TestClient) -> None:
    r = client.post("/api/demo/trigger", json={"scenario": "approval"})
    approval_id = r.json()["approval_id"]
    client.post(f"/api/approvals/{approval_id}/decision", json={"decision": "denied"})
    latest = client.get("/api/events?limit=1").json()[0]
    assert latest["status"] == "blocked"


# ---------------------------------------------------------------------------
# Kill switch
# ---------------------------------------------------------------------------


def test_kill_switch_stops_events(client: TestClient) -> None:
    client.post("/api/kill-switch", json={"on": True})
    r = client.post("/api/demo/trigger", json={"scenario": "masked_inbox"})
    assert r.status_code == 200
    assert r.json()["emitted"] == []
    assert r.json()["reason"] == "kill switch on"

    client.post("/api/kill-switch", json={"on": False})
    r = client.post("/api/demo/trigger", json={"scenario": "masked_inbox"})
    assert r.json()["emitted"] != []

    # Agents are active again.
    statuses = {a["id"]: a["status"] for a in client.get("/api/agents").json()}
    assert all(s == "active" for s in statuses.values())


# ---------------------------------------------------------------------------
# Demo trigger scenarios
# ---------------------------------------------------------------------------


def test_demo_masked_inbox(client: TestClient) -> None:
    r = client.post("/api/demo/trigger", json={"scenario": "masked_inbox"})
    assert r.status_code == 200
    body = r.json()
    assert len(body["emitted"]) == 1
    ev = body["emitted"][0]
    assert ev["agent"] == "Assistant-1"
    assert ev["tool"] == "gmail.read_inbox"
    assert ev["status"] == "masked"
    assert "[CARD_1]" in ev["masked_preview"]
    assert "[OTP_1]" in ev["masked_preview"]


def test_demo_blocked(client: TestClient) -> None:
    r = client.post("/api/demo/trigger", json={"scenario": "blocked"})
    assert r.status_code == 200
    ev = r.json()["emitted"][0]
    assert ev["status"] == "blocked"
    assert ev["agent"] == "Unknown-Agent"
    assert ev["tool"] == "drive.download_all"


# ---------------------------------------------------------------------------
# Oversight
# ---------------------------------------------------------------------------


def test_oversight_get_set(client: TestClient) -> None:
    r = client.get("/api/oversight")
    assert r.status_code == 200
    assert r.json()["mode"] == "flexible"
    assert r.json()["agent_id"] is None

    r = client.post("/api/oversight", json={"mode": "restricted"})
    assert r.status_code == 200
    assert r.json()["mode"] == "restricted"

    r = client.post(
        "/api/agents/shopper-bot/oversight", json={"mode": "unrestricted"}
    )
    assert r.status_code == 200
    assert r.json()["agent_id"] == "shopper-bot"
    assert r.json()["mode"] == "unrestricted"

    r = client.get("/api/agents/shopper-bot/oversight")
    assert r.json()["mode"] == "unrestricted"


# ---------------------------------------------------------------------------
# Tokens
# ---------------------------------------------------------------------------


def test_tokens_list_reveal_revoke(client: TestClient) -> None:
    r = client.get("/api/tokens")
    assert r.status_code == 200
    tokens = r.json()
    assert len(tokens) == 3
    assert all("value" in t for t in tokens)  # revealed representation present

    r = client.post("/api/tokens/tok-gmail-ro/reveal")
    assert r.status_code == 200
    assert r.json()["id"] == "tok-gmail-ro"

    r = client.post("/api/tokens/tok-drive-full/revoke")
    assert r.status_code == 200
    assert r.json()["status"] == "revoked"

    tokens = client.get("/api/tokens").json()
    assert any(t["id"] == "tok-drive-full" and t["status"] == "revoked" for t in tokens)


# ---------------------------------------------------------------------------
# Handoffs
# ---------------------------------------------------------------------------


def test_handoffs(client: TestClient) -> None:
    r = client.get("/api/handoffs")
    assert r.status_code == 200
    handoffs = r.json()
    assert len(handoffs) == 3
    for h in handoffs:
        assert h["from_agent"] and h["to_agent"] and h["context"]
        assert h["status"] in {"pending", "completed", "declined", "revoked"}

    r = client.post(
        "/api/handoffs",
        json={"from_agent": "Planner", "to_agent": "Assistant-1", "context": "sync calendar"},
    )
    assert r.status_code == 201
    assert r.json()["status"] == "pending"
    assert len(client.get("/api/handoffs").json()) == 4


# ---------------------------------------------------------------------------
# Metadata rules
# ---------------------------------------------------------------------------


def test_metadata_rules(client: TestClient) -> None:
    r = client.get("/api/metadata-rules")
    assert r.status_code == 200
    rules = r.json()
    assert len(rules) == 3
    for rule in rules:
        assert rule["action"] in {"mask", "redact", "allow"}

    r = client.post(
        "/api/metadata-rules",
        json={"agent": "Assistant-1", "field": "phone", "action": "mask"},
    )
    assert r.status_code == 201
    assert len(client.get("/api/metadata-rules").json()) == 4


# ---------------------------------------------------------------------------
# Logs
# ---------------------------------------------------------------------------


def test_logs_list(client: TestClient) -> None:
    r = client.get("/api/logs?limit=5")
    assert r.status_code == 200
    data = r.json()
    assert len(data) <= 5
    for ev in data:
        assert EVENT_FIELDS <= set(ev.keys())


def test_logs_export_jsonl(client: TestClient) -> None:
    r = client.get("/api/logs/export")
    assert r.status_code == 200
    text = r.text
    lines = [line for line in text.splitlines() if line.strip()]
    assert len(lines) == 40  # seed events
    for line in lines:
        obj = json.loads(line)
        assert EVENT_FIELDS <= set(obj.keys())


# ---------------------------------------------------------------------------
# WebSocket
# ---------------------------------------------------------------------------


def test_websocket_receives_event_after_demo_trigger(client: TestClient) -> None:
    with client.websocket_connect("/ws/events") as ws:
        client.post("/api/demo/trigger", json={"scenario": "blocked"})
        msg = ws.receive_text()
        data = json.loads(msg)
        assert data["status"] == "blocked"
        assert data["tool"] == "drive.download_all"
        assert data["agent"] == "Unknown-Agent"
        assert EVENT_FIELDS <= set(data.keys())


def test_websocket_receives_permission_blocked_event(client: TestClient) -> None:
    with client.websocket_connect("/ws/events") as ws:
        client.patch(
            "/api/agents/assistant-1/permissions",
            json={"key": "drive.download_all", "value": "deny"},
        )
        msg = ws.receive_text()
        data = json.loads(msg)
        assert data["status"] == "blocked"
        assert data["tool"] == "drive.download_all"
