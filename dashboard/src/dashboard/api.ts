/**
 * Data adapter. Mock/demo mode by default (uses mockData.ts). When
 * ``VITE_VEIL_API_URL`` is set, talks to the VEIL gateway REST API and
 * the ``/ws/events`` WebSocket, falling back to mock mode if the backend
 * is unreachable. Field names, verbs and paths match the AGENTS.md
 * section 4 contract exactly.
 *
 * Connection state is exposed through ``getMode`` / ``onModeChange``:
 * "Live" only while the backend is reachable (and the WS is open),
 * otherwise "Demo mode".
 */
import type {
  Agent,
  Approval,
  Identity,
  IdentityKind,
  Status,
  VeilEvent,
} from './types';
import { AGENTS, APPROVALS, IDENTITIES, seedEvents } from './mockData';

const BASE = import.meta.env.VITE_VEIL_API_URL as string | undefined;

export type Mode = 'live' | 'demo';
export type Unsubscribe = () => void;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Connection / mode
// ---------------------------------------------------------------------------

let currentMode: Mode = 'demo';
const modeSubs = new Set<(m: Mode) => void>();

function setMode(m: Mode) {
  if (currentMode !== m) {
    currentMode = m;
    modeSubs.forEach((fn) => fn(m));
  }
}

export function onModeChange(fn: (m: Mode) => void): Unsubscribe {
  modeSubs.add(fn);
  return () => modeSubs.delete(fn);
}

export function getMode(): Promise<Mode> {
  if (!BASE) {
    setMode('demo');
    return Promise.resolve('demo');
  }
  return fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(2500) })
    .then((r) => {
      if (!r.ok) throw new Error(`health ${r.status}`);
      setMode('live');
      return 'live' as Mode;
    })
    .catch((err) => {
      console.warn('[veil] backend unreachable, demo mode:', (err as Error).message);
      setMode('demo');
      return 'demo' as Mode;
    });
}

// ---------------------------------------------------------------------------
// In-memory mock backend (used in demo mode, and as fallback)
// ---------------------------------------------------------------------------

let events: VeilEvent[] = seedEvents();
const listeners = new Set<(e: VeilEvent) => void>();

export function pushMockEvent(partial: Omit<VeilEvent, 'id' | 'timestamp'> & { id?: string }): VeilEvent {
  const ev: VeilEvent = {
    id: partial.id ?? `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...partial,
  };
  events = [ev, ...events].slice(0, 300);
  listeners.forEach((l) => l(ev));
  return ev;
}

function demoFallback<T>(fn: () => Promise<T>): () => Promise<T> {
  return async () => {
    if (!BASE) return fn();
    try {
      return await fn();
    } catch (err) {
      console.warn('[veil] request failed, demo mode:', (err as Error).message);
      setMode('demo');
      return fn();
    }
  };
}

// ---------------------------------------------------------------------------
// REST
// ---------------------------------------------------------------------------

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  if (!BASE) throw new Error('no API URL');
  const r = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r;
}

async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const r = await apiFetch(path, init);
  return (await r.json()) as T;
}

export async function getEvents(): Promise<VeilEvent[]> {
  if (BASE) {
    try {
      return await apiJson<VeilEvent[]>(`/events?limit=300`);
    } catch { /* fall through to mock */ }
  }
  await wait(120);
  return events;
}

export async function getAgents(): Promise<Agent[]> {
  if (BASE) {
    try {
      return await apiJson<Agent[]>(`/agents`);
    } catch { /* mock */ }
  }
  await wait(100);
  return AGENTS.map((a) => ({ ...a, permissions: { ...a.permissions } }));
}

export async function updatePermission(
  agentId: string,
  key: string,
  value: Agent['permissions'][string],
): Promise<void> {
  const go = async () => {
    await apiFetch(`/agents/${encodeURIComponent(agentId)}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ key, value }),
    });
  };
  await demoFallback(go)();
  // Mirror locally so the UI reacts immediately (WS will broadcast backend events).
  const a = AGENTS.find((x) => x.id === agentId);
  if (a) a.permissions[key] = value;
}

export async function setAgentStatus(agentId: string, status: Agent['status']): Promise<void> {
  const go = async () => {
    await apiFetch(`/agents/${encodeURIComponent(agentId)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  };
  await demoFallback(go)();
  const a = AGENTS.find((x) => x.id === agentId);
  if (a) a.status = status;
}

export async function getIdentities(): Promise<Identity[]> {
  if (BASE) {
    try {
      return await apiJson<Identity[]>(`/identities`);
    } catch { /* mock */ }
  }
  await wait(100);
  return [...IDENTITIES];
}

let aliasSeq = 0;
const KIND_ALIASES: Record<IdentityKind, string> = {
  email: 'alias.mail@veil.alias',
  phone: '+91 00000 11111',
  name: 'R. Person',
  address: '88 Cloak Way, Puffin City',
};

export async function createIdentity(kind: IdentityKind): Promise<Identity> {
  aliasSeq += 1;
  const idn: Identity = {
    id: `id-${Date.now()}`,
    kind,
    alias: KIND_ALIASES[kind].replace('@', `${aliasSeq}@`),
    used_by: [],
    status: 'active',
  };
  IDENTITIES.unshift(idn);
  if (BASE) {
    try {
      const r = await apiJson<Identity>(`/identities`, {
        method: 'POST',
        body: JSON.stringify({ kind }),
      });
      return r;
    } catch { /* mock already added */ }
  }
  return idn;
}

export async function revokeIdentity(id: string): Promise<void> {
  const idn = IDENTITIES.find((x) => x.id === id);
  if (idn) idn.status = 'revoked';
  if (BASE) {
    try {
      await apiFetch(`/identities/${encodeURIComponent(id)}/revoke`, { method: 'POST' });
      return;
    } catch { /* mock */ }
  }
}

export async function getApprovals(): Promise<Approval[]> {
  if (BASE) {
    try {
      return await apiJson<Approval[]>(`/approvals`);
    } catch { /* mock */ }
  }
  await wait(100);
  return [...APPROVALS];
}

export async function decideApproval(
  id: string,
  decision: 'approved' | 'denied',
): Promise<void> {
  const apr = APPROVALS.find((x) => x.id === id);
  if (apr) apr.status = decision;
  const go = async () => {
    await apiFetch(`/approvals/${encodeURIComponent(id)}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision }),
    });
  };
  await demoFallback(go)();
}

export async function killSwitch(on: boolean): Promise<void> {
  for (const a of AGENTS) a.status = on ? 'paused' : 'active';
  const go = async () => {
    await apiFetch(`/kill-switch`, { method: 'POST', body: JSON.stringify({ on }) });
  };
  await demoFallback(go)();
}

export async function demoTrigger(scenario: 'masked_inbox' | 'approval' | 'blocked'): Promise<void> {
  await demoFallback(async () => {
    await apiFetch(`/demo/trigger`, {
      method: 'POST',
      body: JSON.stringify({ scenario }),
    });
  })();
}

// ---------------------------------------------------------------------------
// WebSocket events with exponential-backoff reconnect
// ---------------------------------------------------------------------------

export function subscribeToEvents(cb: (e: VeilEvent) => void): Unsubscribe {
  listeners.add(cb);
  let ws: WebSocket | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let backoff = 500;
  const MAX_BACKOFF = 30_000;

  function connect() {
    if (!BASE) {
      setMode('demo');
      return;
    }
    try {
      const url = `${BASE.replace(/^http/, 'ws')}/ws/events`;
      ws = new WebSocket(url);
      ws.onopen = () => {
        setMode('live');
        backoff = 500;
      };
      ws.onmessage = (m) => {
        try {
          cb(JSON.parse(m.data as string) as VeilEvent);
        } catch {
          /* ignore bad frames */
        }
      };
      ws.onerror = () => {
        ws?.close();
      };
      ws.onclose = () => {
        ws = null;
        setMode('demo');
        scheduleReconnect();
      };
    } catch {
      setMode('demo');
      scheduleReconnect();
    }
  }

  function scheduleReconnect() {
    if (timer || !BASE) return;
    timer = setTimeout(() => {
      timer = null;
      backoff = Math.min(backoff * 2, MAX_BACKOFF);
      connect();
    }, backoff);
  }

  connect();

  return () => {
    listeners.delete(cb);
    if (timer) clearTimeout(timer);
    ws?.close();
  };
}

/** Derives an event status from the tool used (used by the event generator in the store). */
export function statusForTool(tool: string, agentKnown: boolean): Status {
  if (!agentKnown) return 'blocked';
  if (tool === 'store.checkout') return 'approval_needed';
  if (tool === 'gmail.read_inbox' || tool === 'gmail.send_email') return 'masked';
  return 'allowed';
}
