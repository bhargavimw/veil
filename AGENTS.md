# AGENTS.md: VEIL

Guidance for coding agents working in this repository. Read fully before changing anything.
(If your tool expects `CLAUDE.md`, `GEMINI.md` or `.cursorrules`, copy this file to that name.)

## 1. Project in one paragraph
VEIL is a personal privacy gateway for AI agents using MCP. It sits between an agent and
MCP services (Gmail, Calendar, Drive, ...) and applies, in order: identity swap (virtual
aliases) -> permission policy (allow / mask / ask / deny) -> PII masking -> audit log.
Responses are filtered on the way back. Fail closed: if any stage errors, block the call.
A dashboard shows live activity, what the agent actually saw, approvals and permissions.

## 2. Repo layout (verify against the actual tree; update this section if it differs)
```
gateway/      FastAPI app + MCP proxy + pipeline (Python)
identity/     alias vault
privacy/      PII detection and reversible masking (Presidio + custom regex)
policy/       YAML rules engine
audit/        append-only event log
connectors/   Gmail, Calendar, ... stubs
dashboard/    FRONTEND: Vite + React + TypeScript + Tailwind (see section 3)
tests/        pytest
docs/
```

## 3. Frontend decisions (already made, do not revisit)
- The dashboard is a **Vite + React + TypeScript SPA** generated with Bolt.new. The earlier
  Next.js frontend is being **replaced**, not merged. Do not convert the Vite app to Next.js.
- Stack: React, Vite, TypeScript (strict), Tailwind CSS, Framer Motion, lucide-react,
  react-router-dom. Keep dependencies minimal.
- Routes: `/` is the marketing/landing site, `/dashboard/*` is the product dashboard.
- Data access goes **only** through `dashboard/src/dashboard/api.ts`. No component calls
  `fetch` or WebSocket directly.
- `api.ts` has two modes: **mock** (default, uses `mockData.ts`) and **live** (when
  `VITE_VEIL_API_URL` is set). If the backend is unreachable, fall back to mock and show a
  "Demo mode" badge. Never crash on a failed request.
- Deployed as a static site on Vercel. `vercel.json` must contain an SPA rewrite to
  `/index.html` so `/dashboard` survives a refresh.

## 4. Backend contract (the frontend and backend must match exactly)
```ts
type Status = "allowed" | "masked" | "approval_needed" | "blocked";

interface VeilEvent {
  id: string; timestamp: string; agent: string; app: string; tool: string;
  status: Status; pii_found: string[]; policy_rule: string;
  original_preview: string; masked_preview: string;
}
interface Agent {
  id: string; name: string; status: "active" | "paused" | "revoked";
  last_active: string; privacy_score: number;
  permissions: Record<string, "allow" | "mask" | "ask" | "deny">; // key = "app.tool"
}
interface Identity {
  id: string; kind: "email" | "phone" | "name" | "address";
  alias: string; used_by: string[]; status: "active" | "revoked";
}
interface Approval {
  id: string; agent: string; app: string; action: string; details: string;
  data_to_release: string[]; status: "pending" | "approved" | "denied"; created_at: string;
}
```
Endpoints (FastAPI, JSON, prefix `/api`):
| Method | Path | Purpose |
|---|---|---|
| GET | /api/events?limit=&agent=&app=&status= | list events |
| GET | /api/agents | list agents |
| PATCH | /api/agents/{id}/permissions | body `{ "key": "gmail.read_inbox", "value": "mask" }` |
| POST | /api/agents/{id}/status | body `{ "status": "paused" \| "active" \| "revoked" }` |
| GET / POST | /api/identities | list / create `{ "kind": "email" }` |
| POST | /api/identities/{id}/revoke | revoke |
| GET | /api/approvals | list |
| POST | /api/approvals/{id}/decision | body `{ "decision": "approved" \| "denied" }` |
| POST | /api/kill-switch | body `{ "on": true }` |
| POST | /api/demo/trigger | body `{ "scenario": "masked_inbox" \| "approval" \| "blocked" }` (demo only) |
| WS | /ws/events | pushes each new `VeilEvent` as JSON |
| GET | /api/health | `{ "ok": true }` |

Backend rules: enable CORS from the dashboard origin(s) (env `VEIL_CORS_ORIGINS`), validate
all bodies with Pydantic, return the exact field names above (snake_case), never return
real secrets or tokens.

## 5. Working rules
1. **Inspect before acting.** Read the tree, `package.json`, configs and git status first.
2. **Never touch** `.git/`, never rewrite history, never force-push, never switch branches.
   Work on the current branch and make small, descriptive commits (`feat:`, `fix:`, `chore:`).
3. **Destructive actions** (deleting the old Next.js files, removing dependencies) go in their
   **own commit**, after the new setup builds, so they are easy to revert. List every deleted
   path in your final summary.
4. **Shell command discipline:** before any command that changes the system or files, run a
   command that checks the current state; after it, run a command that verifies the result.
5. Do not add paid services, API keys or telemetry. Everything runs locally and free.
6. **No real personal data anywhere.** Use obviously fake sample data (names, phone numbers,
   test card `4111 1111 1111 1111`).
7. Never commit secrets. Use `.env.example` with placeholders; keep `.env*` in `.gitignore`.
8. Fail closed in the gateway; fail soft (mock-mode fallback) in the dashboard.
9. Keep code readable and commented where non-obvious. TypeScript strict, no `any` unless
   unavoidable. Python: type hints, ruff-clean.
10. If something is ambiguous, choose the simplest option consistent with this file, note the
    assumption in the summary, and continue. Do not stop to ask unless blocked.

## 6. Commands
```bash
# frontend (from dashboard/)
npm install
npm run dev        # Vite dev server, default http://localhost:5173
npm run build      # must pass with zero TypeScript errors
npm run lint       # if configured

# backend (from repo root)
pip install -e ".[dev]"   # or: uv sync
uvicorn gateway.main:app --reload --port 8000
pytest
ruff check .

# full stack
docker compose up --build
```
Environment variables: frontend `VITE_VEIL_API_URL` (e.g. `http://localhost:8000`); backend
`VEIL_CORS_ORIGINS` (comma-separated, include `http://localhost:5173` and the Vercel URL).

## 7. Definition of done for any task
- `npm run build` and `pytest` pass; `ruff check .` is clean.
- Dashboard works in **mock mode** with no backend, and in **live mode** against the backend.
- A refresh on `/dashboard/activity` works locally (and on Vercel via the rewrite).
- No console errors in the browser; no leftover Next.js-only imports (`next/*`).
- README and `.env.example` reflect how to run both parts.
- Final summary lists: what changed, files deleted, assumptions made, and what remains.
