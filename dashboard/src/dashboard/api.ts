/**
 * Data adapter. Works against mock data by default; if VITE_VEIL_API_URL is
 * set, uses fetch against that base URL (WebSocket at /ws/events for
 * subscribeToEvents) and falls back to mock mode if unreachable.
 */
import type { Agent, Approval, Identity, IdentityKind, Status, VeilEvent } from './types';
import { AGENTS, APPROVALS, IDENTITIES, seedEvents } from './mockData';

const BASE = import.meta.env.VITE_VEIL_API_URL as string | undefined;

export type Mode = 'live' | 'demo';
export type Unsubscribe = () => void;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function probeLive(): Promise<Mode> {
  if (!BASE) return 'demo';
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    await fetch(`${BASE}/health`, { signal: ctrl.signal });
    clearTimeout(t);
    return 'live';
  } catch {
    return 'demo';
  }
}

/* ---------- in-memory mock backend ---------- */

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

/* ---------- public API ---------- */

export async function getMode(): Promise<Mode> {
  return probeLive();
}

export async function getEvents(): Promise<VeilEvent[]> {
  if (BASE) {
    try {
      const r = await fetch(`${BASE}/events`);
      if (r.ok) return (await r.json()) as VeilEvent[];
    } catch { /* fall through to mock */ }
  }
  await wait(120);
  return events;
}

export function subscribeToEvents(cb: (e: VeilEvent) => void): Unsubscribe {
  listeners.add(cb);
  let ws: WebSocket | undefined;
  if (BASE) {
    try {
      const url = `${BASE.replace(/^http/, 'ws')}/ws/events`;
      ws = new WebSocket(url);
      ws.onmessage = (m) => {
        try { cb(JSON.parse(m.data as string) as VeilEvent); } catch { /* ignore bad frames */ }
      };
      ws.onerror = () => { /* stay in mock broadcast */ };
    } catch { /* mock only */ }
  }
  return () => {
    listeners.delete(cb);
    ws?.close();
  };
}

export async function getAgents(): Promise<Agent[]> {
  if (BASE) {
    try {
      const r = await fetch(`${BASE}/agents`);
      if (r.ok) return (await r.json()) as Agent[];
    } catch { /* mock */ }
  }
  await wait(100);
  return AGENTS.map((a) => ({ ...a, permissions: { ...a.permissions } }));
}

export async function updatePermission(agentId: string, key: string, value: Agent['permissions'][string]): Promise<void> {
  const a = AGENTS.find((x) => x.id === agentId);
  if (a) a.permissions[key] = value;
  if (BASE) {
    try {
      await fetch(`${BASE}/agents/${agentId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      return;
    } catch { /* mock already updated */ }
  }
}

export async function setAgentStatus(agentId: string, status: Agent['status']): Promise<void> {
  const a = AGENTS.find((x) => x.id === agentId);
  if (a) a.status = status;
  if (BASE) {
    try {
      await fetch(`${BASE}/agents/${agentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      return;
    } catch { /* mock */ }
  }
}

export async function getIdentities(): Promise<Identity[]> {
  if (BASE) {
    try {
      const r = await fetch(`${BASE}/identities`);
      if (r.ok) return (await r.json()) as Identity[];
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
      const r = await fetch(`${BASE}/identities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      if (r.ok) return (await r.json()) as Identity;
    } catch { /* mock already added */ }
  }
  return idn;
}

export async function revokeIdentity(id: string): Promise<void> {
  const idn = IDENTITIES.find((x) => x.id === id);
  if (idn) idn.status = 'revoked';
  if (BASE) {
    try {
      await fetch(`${BASE}/identities/${id}/revoke`, { method: 'POST' });
      return;
    } catch { /* mock */ }
  }
}

export async function getApprovals(): Promise<Approval[]> {
  if (BASE) {
    try {
      const r = await fetch(`${BASE}/approvals`);
      if (r.ok) return (await r.json()) as Approval[];
    } catch { /* mock */ }
  }
  await wait(100);
  return [...APPROVALS];
}

export async function decideApproval(id: string, decision: 'approved' | 'denied'): Promise<void> {
  const apr = APPROVALS.find((x) => x.id === id);
  if (apr) apr.status = decision;
  if (BASE) {
    try {
      await fetch(`${BASE}/approvals/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      });
      return;
    } catch { /* mock */ }
  }
}

export async function killSwitch(on: boolean): Promise<void> {
  for (const a of AGENTS) a.status = on ? 'paused' : 'active';
  if (BASE) {
    try {
      await fetch(`${BASE}/kill-switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ on }),
      });
      return;
    } catch { /* mock */ }
  }
}

/** Derives an event status from the tool used (used by the event generator in the store). */
export function statusForTool(tool: string, agentKnown: boolean): Status {
  if (!agentKnown) return 'blocked';
  if (tool === 'store.checkout') return 'approval_needed';
  if (tool === 'gmail.read_inbox' || tool === 'gmail.send_email') return 'masked';
  return 'allowed';
}
