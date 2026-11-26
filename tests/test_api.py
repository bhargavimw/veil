"""Contract tests for the VEIL dashboard API (AGENTS.md section 4).

Covers response shapes, permission-driven outcomes, the approval flow,
the kill switch and the WebSocket event bus.
"""

from __future__ import annotations

import json

from fastapi.testclient import TestClient

from gateway.main import app

client = TestClient(app)

EVENT_FIELDS = {
    "id", "timestamp", "agent", "app", "tool", "status",
    "pii_found", "policy_rule", "original_preview", "masked_preview",
}
AGENT_FIELDS = {"id", "name", "status", "last_active", "privacy_score", "permissions"}
IDENTITY_FIELDS = {"id", "kind", "alias", "used_by", "status"}
APPROVAL_FIELDS = {"id", "agent", "app", "action", "details", "data_to_release", "status", "created_at"}
STATUSES = {"allowed", "masked", "approval_needed", "blocked"}


def test_health() -> None:
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"ok": True}


def test_events_shape() -> None:
    r = client.get("/api/events?limit=3")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) <= 3
    for ev in data:
        assert EVENT_FIELDS <= set(ev.keys()), ev.keys()
        assert ev["status"] in STATUSES


def test_events_filtering() -> None:
    r = client.get("/api/events?agent=Unknown-Agent&status=blocked&limit=10")
    assert r.status_code == 200
    data = r.json()
    assert all(e["agent"] == "Unknown-Agent" and e["status"] == "blocked" for e in data)


def test_agents_shape() -> None:
    r = client.get("/api/agents")
    assert r.status_code == 200
    agents = r.json()
    assert len(agents) == 4
    for a in agents:
        assert AGENT_FIELDS <= set(a.keys())
        assert a["status"] in {"active", "paused", "revoked"}
        for v in a["permissions"].values():
            assert v in {"allow", "mask", "ask", "deny"}


def test_identities_shape() -> None:
    r = client.get("/api/identities")
    assert r.status_code == 200
    idents = r.json()
    assert len(idents) == 5
    for i in idents:
        assert IDENTITY_FIELDS <= set(i.keys())
        assert i["kind"] in {"email", "phone", "name", "address"}


def test_approvals_shape() -> None:
    r = client.get("/api/approvals")
    assert r.status_code == 200
    ap = r.json()
    assert any(a["id"] == "apr-seed-1" and a["status"] == "pending" for a in ap)
    for a in ap:
        assert APPROVAL_FIELDS <= set(a.keys())


def test_permission_change_affects_outcome() -> None:
    # Deny Gmail reads for Assistant-1 -> the masked_inbox demo becomes blocked.
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


def test_approval_flow() -> None:
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


def test_denied_approval_emits_blocked() -> None:
    r = client.post("/api/demo/trigger", json={"scenario": "approval"})
    approval_id = r.json()["approval_id"]
    client.post(f"/api/approvals/{approval_id}/decision", json={"decision": "denied"})
    latest = client.get("/api/events?limit=1").json()[0]
    assert latest["status"] == "blocked"


def test_kill_switch_stops_events() -> None:
    client.post("/api/kill-switch", json={"on": True})
    r = client.post("/api/demo/trigger", json={"scenario": "masked_inbox"})
    assert r.status_code == 200
    assert r.json()["emitted"] == []
    assert r.json()["reason"] == "kill switch on"

    client.post("/api/kill-switch", json={"on": False})
    r = client.post("/api/demo/trigger", json={"scenario": "masked_inbox"})
    assert r.json()["emitted"] != []


def test_websocket_receives_event() -> None:
    with client.websocket_connect("/ws/events") as ws:
        client.post("/api/demo/trigger", json={"scenario": "blocked"})
        msg = ws.receive_text()
        data = json.loads(msg)
        assert data["status"] == "blocked"
        assert data["tool"] == "drive.download_all"
        assert data["agent"] == "Unknown-Agent"
