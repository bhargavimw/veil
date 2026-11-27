import type React from 'react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Bot, Eye, FileText, KeyRound, ShieldCheck, Shield, Users, Link2, Mail, Calendar, HardDrive, ShoppingBag } from 'lucide-react';
import { useStore } from '../store';
import { StatCard } from '../components/StatCard';
import { StatusChip } from '../components/StatusChip';
import { GroupedAlertBanner } from '../components/GroupedAlertBanner';
import { Drawer } from '../components/Drawer';
import { SplitView } from '../components/SplitView';
import type { VeilEvent, ConnectedApp } from '../types';

const MODE_LABELS: Record<string, string> = {
  restricted: 'Restricted',
  flexible: 'Flexible',
  unrestricted: 'Unrestricted',
};

export function Overview() {
  const { events, agents, alerts, dismissAllAlerts, setAgentStatus, pushToast, tokens, metadataStripped, oversightMode, connectedApps, connectApp, disconnectApp } = useStore();
  const [selected, setSelected] = useState<VeilEvent | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!selected) return;
    const fresh = events.find((e) => e.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [events, selected]);

  const protectedCount = 1200 + events.length;
  const maskedCount = events.filter((e) => e.status === 'masked').length * 3 + 12;
  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const score = agents.length ? Math.round(agents.reduce((s, a) => s + a.privacy_score, 0) / agents.length) : 0;
  const activeTokens = tokens.filter((t) => t.status === 'active').length;
  const connectedCount = connectedApps.filter((a) => a.status === 'connected').length;
  const latest = events.slice(0, 5);

  const APP_ICONS: Record<string, React.ElementType> = {
    gmail: Mail,
    calendar: Calendar,
    drive: HardDrive,
    store: ShoppingBag,
  };

  const handleRevoke = (agentName: string) => {
    const agent = agents.find((x) => x.name === agentName);
    if (agent) {
      setAgentStatus(agent.id, 'revoked');
      pushToast(`${agentName} has been revoked.`, 'danger');
    }
    dismissAllAlerts();
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {alerts.length > 0 && (
          <GroupedAlertBanner
            events={alerts}
            onView={(e) => setSelected(e)}
            onRevoke={handleRevoke}
            onDismissAll={dismissAllAlerts}
          />
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Your privacy, under control.</h2>
        <p className="mt-1 text-sm text-slate-400">Here's how VEIL is protecting your information across AI agents.</p>
      </div>

      {/* Row 1: original 4 stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Requests protected" value={protectedCount} tone="violet" />
        <StatCard icon={Activity} label="PII items masked" value={maskedCount} tone="cyan" />
        <StatCard icon={Bot} label="Agents connected" value={activeAgents} tone="green" />
        <StatCard icon={Users} label="Privacy score" value={score} suffix="/100" tone="amber" />
      </div>

      {/* Row 2: active tokens, metadata stripped, oversight mode */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={KeyRound} label="Active tokens" value={activeTokens} tone="cyan" />
        <StatCard icon={FileText} label="Metadata fields stripped" value={metadataStripped} tone="violet" />
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-veil-amber/15 text-veil-amber">
              <Eye className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Oversight mode</p>
              <p className="text-lg font-bold capitalize text-white">{MODE_LABELS[oversightMode] ?? oversightMode}</p>
            </div>
          </div>
          <Link
            to="/dashboard/tokens"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-veil-cyan transition-colors hover:text-white"
          >
            Change oversight level →
          </Link>
        </div>
      </div>

      {/* Connected apps strip */}
      <div className="glass overflow-hidden rounded-2xl border border-white/5">
        <div className="border-b border-white/5 px-5 py-4 sm:px-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Connected apps</h3>
            <p className="text-xs text-slate-500">
              {connectedCount} of {connectedApps.length} services connected to VEIL
            </p>
          </div>
          <Link
            to="/dashboard/connected-apps"
            className="inline-flex items-center gap-1 text-xs font-medium text-veil-cyan hover:text-white"
          >
            Manage all →
            <Link2 className="h-3 w-3" />
          </Link>
        </div>
        <div className="px-5 py-4 sm:px-6 flex flex-wrap gap-3">
          {connectedApps.map((app) => {
            const Icon = APP_ICONS[app.id] ?? Shield;
            const connected = app.status === 'connected';
            return (
              <div
                key={app.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  connected
                    ? 'border-veil-green/30 bg-veil-green/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${
                    connected ? 'bg-veil-green/20' : 'bg-white/5'
                  }`}
                >
                  <Icon className={`h-3 w-3 ${connected ? 'text-veil-green' : 'text-slate-500'}`} />
                </div>
                <span className={`font-medium ${connected ? 'text-white' : 'text-slate-400'}`}>
                  {app.name}
                </span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  connected
                    ? 'bg-veil-green/20 text-veil-green'
                    : 'bg-white/5 text-slate-500 border border-white/5'
                }`}>
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
                {!connected && (
                  <button
                    type="button"
                    onClick={() => connectApp(app.id)}
                    className="ml-2 rounded-md bg-gradient-to-r from-veil-violet to-veil-cyan px-2 py-1 text-[10px] font-semibold text-white hover:scale-[1.05] transition-transform"
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="border-b border-white/5 px-5 py-4 sm:px-6">
          <h3 className="font-semibold text-white">Live activity</h3>
          <p className="text-xs text-slate-500">Latest requests through the VEIL gateway</p>
        </div>
        <ul className="divide-y divide-white/5">
          <AnimatePresence initial={false}>
            {latest.map((ev) => (
              <motion.li
                key={ev.id}
                layout
                initial={{ opacity: 0, y: -18, backgroundColor: 'rgba(34,211,238,0.08)' }}
                animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(34,211,238,0)' }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:px-6"
              >
                <StatusChip status={ev.status} />
                <span className="text-sm font-medium text-white">{ev.agent}</span>
                <span className="text-sm text-slate-400">{ev.app} · {ev.tool}</span>
                <span className="ml-auto shrink-0 text-xs tabular-nums text-slate-500">
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title="What the agent saw">
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-white">{selected.agent}</span>
              <StatusChip status={selected.status} />
              <span className="ml-auto text-xs text-slate-500">{selected.app} · {selected.tool}</span>
            </div>
            <SplitView event={selected} />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Detected PII types</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {selected.pii_found.length === 0
                  ? <span className="text-sm text-slate-500">None</span>
                  : selected.pii_found.map((p) => (
                      <span key={p} className="rounded-full bg-veil-red/10 px-2.5 py-0.5 text-xs text-veil-red">{p}</span>
                    ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Policy rule that fired</p>
              <p className="mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-slate-300">{selected.policy_rule}</p>
            </div>
            <button
              type="button"
              onClick={() => { setSelected(null); navigate('/dashboard/agents'); pushToast('Rule created from this event (mock).', 'success'); }}
              className="w-full rounded-lg bg-gradient-to-r from-veil-violet to-veil-cyan px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
            >
              Create rule from this
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
