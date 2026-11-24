# VEIL Architecture

VEIL is privacy middleware between AI agents and external services over the
Model Context Protocol (MCP). Every request flows through a fixed pipeline:

1. **Identity swap** – real identity replaced with a per-service alias
2. **Permission check** – allow / mask / ask / deny per agent, service, tool
3. **PII filter** – sensitive data detected and masked in both directions
4. **Audit log** – every interaction recorded
5. **MCP server** – the call reaches the external service

Responses flow back through the same pipeline in reverse, so masked values
are only unmasked when policy allows.

## Components

| Component | Responsibility |
|---|---|
| `gateway/` | MCP proxy: server toward agents, client toward services |
| `identity/` | Encrypted vault and alias management |
| `privacy/` | PII detection, masking, unmasking |
| `policy/` | Rules engine and scopes |
| `audit/` | Append-only audit log |
| `connectors/` | Per-service plugins (Gmail first) |
| `dashboard/` | Next.js UI: activity, permissions, approvals, identities |

## Security principles

- **Zero trust**: agents never see OAuth tokens or real credentials.
- **Fail closed**: if filtering or policy evaluation fails, the call is blocked.
- **Local-first**: self-hosted by default; nothing leaves your machine unless a
  policy allows it.
