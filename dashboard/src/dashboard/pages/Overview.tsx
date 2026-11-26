import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, Bot, ShieldCheck, Users } from 'lucide-react';
import { useStore } from '../store';
import { StatCard } from '../components/StatCard';
import { StatusChip } from '../components/StatusChip';
import { AlertBanner } from '../components/AlertBanner';
import { Drawer } from '../components/Drawer';
import { SplitView } from '../components/SplitView';
import type { VeilEvent } from '../types';

export function Overview() {
  const { events, agents, alerts, dismissAlert, setAgentStatus, pushToast } = useStore();
  const [selected, setSelected] = useState<VeilEvent | null>(null);
  const navigate = useNavigate();

  // keep the drawer content in sync with incoming store updates
  useEffect(() => {
    if (!selected) return;
    const fresh = events.find((e) => e.id === selected.id);
    if (fresh && fresh !== selected) setSelected(fresh);
  }, [events, selected]);

  const protectedCount = 1200 + events.length;
  const maskedCount = events.filter((e) => e.status === 'masked').length * 3 + 12;
  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const score = agents.length ? Math.round(agents.reduce((s, a) => s + a.privacy_score, 0) / agents.length) : 0;

  const latest = events.slice(0, 5);

  return (
    <div className="space-y-6">
      {alerts.map((a) => (
        <AlertBanner
          key={a.id}
          agent={a.agent}
          message={`tried to download all Drive files. Blocked.`}
          onView={() => { setSelected(a); dismissAlert(a.id); }}
          onRevoke={() => {
            const agent = agents.find((x) => x.name === a.agent);
            if (agent) setAgentStatus(agent.id, 'revoked');
            dismissAlert(a.id);
            pushToast(`${a.agent} has been revoked.`, 'danger');
          }}
          onDismiss={() => dismissAlert(a.id)}
        />
      ))}

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Your privacy, under control.</h2>
        <p className="mt-1 text-sm text-slate-400">Here's how VEIL is protecting your information across AI agents.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Requests protected" value={protectedCount} tone="violet" />
        <StatCard icon={Activity} label="PII items masked" value={maskedCount} tone="cyan" />
        <StatCard icon={Bot} label="Agents connected" value={activeAgents} tone="green" />
        <StatCard icon={Users} label="Privacy score" value={score} suffix="/100" tone="amber" />
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
