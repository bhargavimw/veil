import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../store';
import { EventTable } from '../components/EventTable';
import { Drawer } from '../components/Drawer';
import { SplitView } from '../components/SplitView';
import { StatusChip } from '../components/StatusChip';
import type { Status, VeilEvent } from '../types';

const STATUSES: Status[] = ['allowed', 'masked', 'approval_needed', 'blocked'];

export function Activity() {
  const { events } = useStore();
  const [agent, setAgent] = useState('all');
  const [app, setApp] = useState('all');
  const [status, setStatus] = useState<'all' | Status>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<VeilEvent | null>(null);

  const agentNames = useMemo(() => [...new Set(events.map((e) => e.agent))], [events]);
  const appNames = useMemo(() => [...new Set(events.map((e) => e.app))], [events]);

  const filtered = events.filter((e) => {
    if (agent !== 'all' && e.agent !== agent) return false;
    if (app !== 'all' && e.app !== app) return false;
    if (status !== 'all' && e.status !== status) return false;
    if (q) {
      const hay = `${e.agent} ${e.app} ${e.tool} ${e.original_preview} ${e.masked_preview}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const selectCls =
    'h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 focus:border-veil-cyan/40 focus:outline-none';

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Activity log</h2>
        <p className="mt-1 text-sm text-slate-400">Every request agents made through the gateway. Click a row to inspect it.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events…"
            aria-label="Search events"
            className="h-9 w-56 rounded-lg border border-white/10 bg-white/[0.04] pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-veil-cyan/40 focus:outline-none"
          />
        </div>
        <select value={agent} onChange={(e) => setAgent(e.target.value)} aria-label="Filter by agent" className={selectCls}>
          <option value="all">All agents</option>
          {agentNames.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={app} onChange={(e) => setApp(e.target.value)} aria-label="Filter by app" className={selectCls}>
          <option value="all">All apps</option>
          {appNames.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | Status)}
          aria-label="Filter by status"
          className={selectCls}
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-500">{filtered.length} events</span>
      </div>

      <EventTable events={filtered} onSelect={setSelected} />

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
              onClick={() => setSelected(null)}
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
