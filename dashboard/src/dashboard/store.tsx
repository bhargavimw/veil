import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as api from './api';
import type { Agent, Approval, Identity, IdentityKind, ToastMsg, VeilEvent } from './types';

interface Store {
  events: VeilEvent[];
  agents: Agent[];
  identities: Identity[];
  approvals: Approval[];
  killSwitchOn: boolean;
  mode: api.Mode;
  toasts: ToastMsg[];
  alerts: VeilEvent[]; // blocked events not yet dismissed
  updatePermission: (agentId: string, key: string, value: Agent['permissions'][string]) => void;
  setAgentStatus: (agentId: string, status: Agent['status']) => void;
  createIdentity: (kind: IdentityKind) => void;
  revokeIdentity: (id: string) => void;
  decideApproval: (id: string, decision: 'approved' | 'denied') => void;
  toggleKillSwitch: (on: boolean) => void;
  dismissAlert: (id: string) => void;
  pushToast: (text: string, tone?: ToastMsg['tone']) => void;
  dismissToast: (id: number) => void;
  // demo director
  demo: {
    running: boolean;
    paused: boolean;
    step: number;
    play: () => void;
    pause: () => void;
    reset: () => void;
    triggerApproval: () => void;
    triggerBlocked: () => void;
    approvalResolver: ((ok: boolean) => void) | null;
    setApprovalResolver: (fn: ((ok: boolean) => void) | null) => void;
  };
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}

let toastSeq = 1;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<VeilEvent[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [killSwitchOn, setKill] = useState(false);
  const [mode, setMode] = useState<api.Mode>('demo');
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [approvalResolver, setApprovalResolver] = useState<((ok: boolean) => void) | null>(null);

  // demo director state
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [step, setStep] = useState(0);
  const abortRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    api.getMode().then(setMode);
    api.getEvents().then(setEvents);
    api.getAgents().then(setAgents);
    api.getIdentities().then(setIdentities);
    api.getApprovals().then(setApprovals);
    return api.subscribeToEvents((e) => {
      setEvents((prev) => [e, ...prev.filter((x) => x.id !== e.id)].slice(0, 300));
    });
  }, []);

  const pushToast = useCallback((text: string, tone: ToastMsg['tone'] = 'info') => {
    const id = toastSeq++;
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const addEvent = useCallback((ev: Omit<VeilEvent, 'id' | 'timestamp'> & { id?: string }) => {
    return api.pushMockEvent(ev);
  }, []);

  const updatePermission = useCallback((agentId: string, key: string, value: Agent['permissions'][string]) => {
    void api.updatePermission(agentId, key, value);
    setAgents((prev) =>
      prev.map((a) => (a.id === agentId ? { ...a, permissions: { ...a.permissions, [key]: value } } : a)),
    );
    const agent = agents.find((a) => a.id === agentId);
    if (agent) {
      pushToast(`Permission ${key} for ${agent.name} set to ${value}.`, 'info');
      if (value === 'deny') {
        // Per the spec: deny drive.download_all -> the next such event is blocked.
        if (key === 'drive.download_all') {
          addEvent({
            agent: agent.name,
            app: 'Drive',
            tool: 'drive.download_all',
            status: 'blocked',
            pii_found: [],
            policy_rule: 'Agent rule: deny drive.download_all',
            original_preview: 'Bulk download of all Drive files',
            masked_preview: '—',
          });
        }
      }
    }
  }, [agents, pushToast, addEvent]);

  const setAgentStatus = useCallback((agentId: string, status: Agent['status']) => {
    void api.setAgentStatus(agentId, status);
    setAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status, last_active: 'just now' } : a)));
  }, []);

  const createIdentity = useCallback((kind: IdentityKind) => {
    void api.createIdentity(kind).then((idn) => setIdentities((prev) => [idn, ...prev]));
  }, []);

  const revokeIdentity = useCallback((id: string) => {
    void api.revokeIdentity(id);
    setIdentities((prev) => prev.map((i) => (i.id === id ? { ...i, status: 'revoked' } : i)));
    pushToast('Alias revoked. Apps using it will no longer recognise you.', 'danger');
  }, [pushToast]);

  const decideApproval = useCallback((id: string, decision: 'approved' | 'denied') => {
    const apr = approvals.find((a) => a.id === id);
    void api.decideApproval(id, decision);
    setApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: decision } : a)));
    if (apr) {
      addEvent({
        agent: apr.agent,
        app: apr.app,
        tool: apr.action,
        status: decision === 'approved' ? 'allowed' : 'blocked',
        pii_found: apr.data_to_release.length ? ['address'] : [],
        policy_rule:
          decision === 'approved'
            ? 'User approved: release alias data only'
            : 'User denied: request cancelled',
        original_preview: apr.details,
        masked_preview:
          decision === 'approved'
            ? 'Released alias only — real address never shared'
            : '—',
      });
      pushToast(
        decision === 'approved'
          ? 'Approved — the real address was never shared, only the alias.'
          : 'Denied — the agent was told to stop.',
        decision === 'approved' ? 'success' : 'danger',
      );
    }
    approvalResolver?.(decision === 'approved');
    setApprovalResolver(null);
  }, [approvals, addEvent, pushToast, approvalResolver]);

  const toggleKillSwitch = useCallback((on: boolean) => {
    void api.killSwitch(on);
    setKill(on);
    setAgents((prev) => prev.map((a) => ({ ...a, status: on ? 'paused' : 'active' })));
    pushToast(on ? 'Kill switch ON — all agents paused.' : 'Kill switch off — agents resumed.', on ? 'danger' : 'success');
  }, [pushToast]);

  const dismissAlert = useCallback((id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  }, []);

  const alerts = useMemo(
    () => events.filter((e) => e.status === 'blocked' && !dismissed.has(e.id)).slice(0, 3),
    [events, dismissed],
  );

  const triggerApproval = useCallback(() => {
    const id = `apr-live-${Date.now()}`;
    const apr: Approval = {
      id,
      agent: 'Shopper-Bot',
      app: 'Store',
      action: 'store.checkout',
      details: 'Complete checkout for order #9842 with saved payment alias',
      data_to_release: ['alias address only'],
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    setApprovals((prev) => [apr, ...prev]);
    addEvent({
      agent: 'Shopper-Bot',
      app: 'Store',
      tool: 'store.checkout',
      status: 'approval_needed',
      pii_found: ['address'],
      policy_rule: 'store.checkout requires approval (Ask)',
      original_preview: 'Ship to 42 Real Street, Springfield. Pay with saved card.',
      masked_preview: 'Awaiting your approval — nothing released yet.',
    });
    pushToast('Shopper-Bot is waiting for your approval.', 'info');
  }, [addEvent, pushToast]);

  const triggerBlocked = useCallback(() => {
    addEvent({
      agent: 'Unknown-Agent',
      app: 'Drive',
      tool: 'drive.download_all',
      status: 'blocked',
      pii_found: [],
      policy_rule: 'Deny: unlisted agent, fail closed',
      original_preview: 'Bulk download of all Drive files',
      masked_preview: '—',
    });
    pushToast('Unknown-Agent was blocked from downloading all Drive files.', 'danger');
  }, [addEvent, pushToast]);

  /* ---------- demo director: scripted ~90s sequence ---------- */

  const sleep = (ms: number) =>
    new Promise<void>((resolve) => {
      const t = setTimeout(resolve, ms);
      abortRef.current = { stop: () => { clearTimeout(t); resolve(); } };
    });
  // Wait until paused===false or aborted; poll cheaply.
  const waitWhilePaused = async () => {
    while (paused && running) await sleep(200);
  };

  const play = useCallback(() => {
    if (running) return;
    setRunning(true);
    setPaused(false);
    setStep(1);

    void (async () => {
      // 1) calm start
      setAgents((prev) => prev.map((a) => (a.id === 'assistant-1' ? { ...a, privacy_score: 96 } : a)));
      await sleep(4000);
      await waitWhilePaused();
      if (!running) return;

      // 2) Assistant-1 reads Gmail inbox: masked event with PII
      addEvent({
        agent: 'Assistant-1',
        app: 'Gmail',
        tool: 'gmail.read_inbox',
        status: 'masked',
        pii_found: ['name', 'card', 'phone', 'otp'],
        policy_rule: 'PII filter: mask name, card, phone, OTP',
        original_preview: 'Hi Aarav, your card is 4111 1111 1111 1111, phone 9876543210, OTP 419332.',
        masked_preview: 'Hi [NAME_1], your card is [CARD_1], phone [PHONE_1], OTP [OTP_1].',
      });
      setStep(2);
      await sleep(9000);
      await waitWhilePaused();
      if (!running) return;

      // 3) Planner reads Calendar: allowed
      addEvent({
        agent: 'Planner',
        app: 'Calendar',
        tool: 'calendar.read_events',
        status: 'allowed',
        pii_found: [],
        policy_rule: 'Free/busy only',
        original_preview: 'Dentist appointment Tue 3pm, Dr. Rao, Room 4B',
        masked_preview: 'Busy: Tuesday 15:00-16:00',
      });
      setStep(3);
      await sleep(9000);
      await waitWhilePaused();
      if (!running) return;

      // 4) Shopper-Bot checkout: approval_needed, pending approval, bell pulses
      triggerApproval();
      setStep(4);

      // wait for user approval up to ~30s
      await new Promise<boolean>((resolve) => {
        let done = false;
        setApprovalResolver(() => {
          return (ok: boolean) => { if (!done) { done = true; resolve(ok); } };
        });
        setTimeout(() => { if (!done) { done = true; resolve(false); } }, 30000);
      });
      if (!running) return;

      // 5) log the outcome event + toast (already handled in decideApproval, but ensure a toast for demo)
      setStep(5);
      await sleep(9000);
      await waitWhilePaused();
      if (!running) return;

      // 6) Unknown-Agent blocked event, score dips
      triggerBlocked();
      setAgents((prev) => prev.map((a) => (a.id === 'assistant-1' ? { ...a, privacy_score: 72 } : a)));
      setStep(6);
      await sleep(9000);
      await waitWhilePaused();
      if (!running) return;
      setAgents((prev) => prev.map((a) => (a.id === 'assistant-1' ? { ...a, privacy_score: 96 } : a)));

      // 7) user clicks Revoke on the agent -> handled by UI; we just finish
      setRunning(false);
      setStep(0);
    })();
  }, [running, waitWhilePaused, addEvent, triggerApproval, triggerBlocked]);

  const pause = useCallback(() => {
    setPaused((p) => {
      if (p) setRunning(true);
      return !p;
    });
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.stop();
    setRunning(false);
    setPaused(false);
    setStep(0);
    setApprovalResolver(null);
    api.getEvents().then(setEvents);
    api.getAgents().then(setAgents);
    api.getApprovals().then(setApprovals);
    api.getIdentities().then(setIdentities);
  }, []);

  const value = useMemo<Store>(
    () => ({
      events,
      agents,
      identities,
      approvals,
      killSwitchOn,
      mode,
      toasts,
      alerts,
      updatePermission,
      setAgentStatus,
      createIdentity,
      revokeIdentity,
      decideApproval,
      toggleKillSwitch,
      dismissAlert,
      pushToast,
      dismissToast,
      demo: { running, paused, step, play, pause, reset, triggerApproval, triggerBlocked, approvalResolver, setApprovalResolver },
    }),
    [
      events, agents, identities, approvals, killSwitchOn, mode, toasts, alerts,
      updatePermission, setAgentStatus, createIdentity, revokeIdentity, decideApproval,
      toggleKillSwitch, dismissAlert, pushToast, dismissToast,
      running, paused, step, play, pause, reset, triggerApproval, triggerBlocked, approvalResolver,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
