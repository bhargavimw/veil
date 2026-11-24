# Connecting Agents to VEIL

VEIL exposes an MCP-compatible gateway that your agent connects to instead of
talking to services directly.

## Quick start

```bash
cp .env.example .env
# edit .env, then generate a Fernet key:
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
docker compose up --build
```

Then point your MCP-compatible agent at the VEIL gateway endpoint
(default `http://localhost:8000`). The agent's requests flow through identity
swap, permission check, PII filtering and audit logging before reaching the
target service.

## Pipeline

```
Agent  ──►  VEIL  ──►  MCP server (Gmail, Calendar, Drive...)
            │
            ├─ 1. Identity swap      (real identity → alias)
            ├─ 2. Permission check   (allow / mask / ask / deny)
            ├─ 3. PII filter         (mask sensitive data)
            └─ 4. Audit log          (record the interaction)
```

Responses go back through the same pipeline before the agent sees them.

> Status: early development. Interfaces may change.
