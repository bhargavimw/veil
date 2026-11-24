# VEIL – Personal Data Privacy Gateway

> A privacy layer between you, your AI agents and the apps they talk to, built on MCP.

VEIL is middleware that sits between AI agents and external services (Gmail, Calendar, Drive, and more). It gives agents **virtual identities**, **filters sensitive data automatically**, enforces **permission-based access** and lets you **monitor everything** an agent sees or does. Agents get only the data they need to complete a task, never your full personal profile.

## Why VEIL

AI agents connected through MCP usually get full-scope access to your accounts. You can't easily see what they read, limit what they can touch, or stop them from leaking sensitive details (IDs, card numbers, OTPs, addresses) into third-party logs and prompts. VEIL fixes that.

## How it works

```
Agent  ──►  VEIL  ──►  MCP server (Gmail, Calendar, Drive...)
            │
            ├─ 1. Identity swap      (real identity → alias)
            ├─ 2. Permission check   (allow / mask / ask / deny)
            ├─ 3. PII filter         (mask sensitive data)
            └─ 4. Audit log          (record the interaction)
```

Responses go back through the same pipeline before the agent sees them.

## Features

- **Virtual identities**: per-service or per-task aliases for name, email, phone and address; revocable and disposable.
- **Sensitive-data filtering**: detects and masks PII in both directions; restores real values only when policy allows.
- **Permission control**: per-agent, per-service, per-tool scopes; read-only, field-level, time-limited and one-time approvals.
- **Privacy monitoring**: searchable audit log, dashboard, anomaly alerts, one-click revoke and kill switch.
- **Data minimization**: return only what the task needs (e.g. free/busy instead of event details).

## Architecture

| Component | Responsibility |
|---|---|
| `gateway/` | MCP proxy (server toward agents, client toward services) |
| `identity/` | Encrypted vault and alias management |
| `privacy/` | PII detection, masking, unmasking |
| `policy/` | Rules engine and scopes |
| `audit/` | Logging, metrics, alerts |
| `connectors/` | Gmail, Calendar, Drive and other plugins |
| `dashboard/` | Next.js UI for permissions, approvals, activity |

## Tech stack

Python · FastAPI · MCP SDK · Presidio / spaCy · SQLite / Postgres · Next.js · Docker Compose · (optional) Ollama for local, context-aware detection

## Getting started

```bash
git clone https://github.com/<your-username>/veil.git
cd veil
cp .env.example .env
docker compose up --build
```

Then point your MCP-compatible agent at the VEIL gateway endpoint (see `docs/connecting-agents.md`).

> Status: early development. Interfaces may change.

## Example policy

```yaml
agent: assistant-1
service: gmail
rules:
  - tool: read_message
    action: mask
    mask: [email, phone, otp, card_number, government_id]
  - tool: send_message
    action: ask          # requires user approval
  - tool: delete_message
    action: deny
```

## Roadmap

- [ ] MCP proxy + Gmail connector + basic masking
- [ ] Identity vault + policy engine
- [ ] Approval flow, audit log, dashboard
- [ ] More connectors, leak/red-team test suite, demo

## Security principles

- Zero trust: agents never see OAuth tokens or real credentials.
- Fail closed: if filtering or policy evaluation fails, the request is blocked.
- Local-first: self-hosted by default, no data leaves your machine unless a policy allows it.

## Contributing

Issues and PRs are welcome. See `CONTRIBUTING.md` (coming soon).

## License

MIT
