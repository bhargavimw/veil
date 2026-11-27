import { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Plus, X } from 'lucide-react';
import { useStore } from '../store';
import { Modal } from '../components/Modal';
import { TOOLS } from '../mockData';
import type { OversightMode } from '../types';

const MODE_META: Record<OversightMode, { label: string; desc: string; color: string }> = {
  restricted: { label: 'Restricted', desc: 'Mask by default, deny unknown agents, require approval for sensitive actions.', color: 'text-veil-green' },
  flexible: { label: 'Flexible', desc: 'Allow known apps, mask PII, ask only for payments and external sharing.', color: 'text-veil-cyan' },
  unrestricted: { label: 'Unrestricted', desc: 'Allow everything except explicitly denied tools. Use with caution.', color: 'text-veil-amber' },
};

export function Tokens() {
  const { tokens, createToken, revokeToken, oversightMode, setOversightMode, agents } = useStore();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [agent, setAgent] = useState(agents[0]?.name ?? '');
  const [scopes, setScopes] = useState<string[]>([]);

  const toggleScope = (s: string) => {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Tokens & oversight</h2>
          <p className="mt-1 text-sm text-slate-400">Agent tokens and the oversight level that governs every request.</p>
        </div>
        <button
          type="button"
          onClick={() => { setOpen(true); setScopes([]); setLabel(''); }}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-veil-violet to-veil-cyan px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-veil-violet/20 transition-transform hover:scale-[1.03]"
        >
          <Plus className="h-4 w-4" /> Issue token
        </button>
      </div>

      {/* Oversight mode selector */}
      <div className="glass rounded-2xl p-5 sm:p-6">
        <h3 className="font-semibold text-white">Oversight mode</h3>
        <p className="text-xs text-slate-500">Controls how strictly VEIL filters agent requests by default.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(Object.keys(MODE_META) as OversightMode[]).map((m) => {
            const meta = MODE_META[m];
            const active = oversightMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setOversightMode(m)}
                className={`rounded-xl border p-4 text-left transition-all ${
                  active
                    ? 'border-veil-cyan/50 bg-veil-cyan/5 ring-1 ring-veil-cyan/30'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <p className={`text-sm font-bold ${meta.color}`}>{meta.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{meta.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Token list */}
      <div className="glass divide-y divide-white/5 rounded-2xl">
        <div className="flex items-center gap-2 px-5 py-4 sm:px-6">
          <KeyRound className="h-4 w-4 text-slate-500" />
          <h3 className="font-semibold text-white">Agent tokens</h3>
          <span className="ml-auto text-xs text-slate-500">{tokens.filter((t) => t.status === 'active').length} active</span>
        </div>
        {tokens.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:px-6"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                t.status === 'active' ? 'bg-veil-cyan/15 text-veil-cyan' : 'bg-veil-red/15 text-veil-red'
              }`}
            >
              <KeyRound className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{t.label}</p>
              <p className="truncate text-xs text-slate-500">
                {t.agent} · scopes: {t.scopes.join(', ') || 'none'} · last used {t.last_used}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
                t.status === 'active'
                  ? 'bg-veil-green/10 text-veil-green ring-veil-green/30'
                  : 'bg-veil-red/10 text-veil-red ring-veil-red/30'
              }`}
            >
              {t.status}
            </span>
            {t.status === 'active' && (
              <button
                type="button"
                onClick={() => revokeToken(t.id)}
                className="ml-auto inline-flex items-center gap-1 rounded-lg border border-veil-red/30 bg-veil-red/10 px-3 py-1.5 text-xs font-medium text-veil-red transition-colors hover:bg-veil-red/20"
              >
                <X className="h-3.5 w-3.5" /> Revoke
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Issue a new token">
        <div className="space-y-4">
          <div>
            <label htmlFor="tok-label" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Label</label>
            <input
              id="tok-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Assistant-1 prod"
              className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 placeholder:text-slate-600 focus:border-veil-cyan/40 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="tok-agent" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Agent</label>
            <select
              id="tok-agent"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 focus:border-veil-cyan/40 focus:outline-none"
            >
              {agents.map((a) => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Scopes</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TOOLS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleScope(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-mono transition-colors ${
                    scopes.includes(s)
                      ? 'bg-veil-cyan/20 text-veil-cyan ring-1 ring-veil-cyan/40'
                      : 'border border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => { createToken(label, agent, scopes); setOpen(false); }}
            className="w-full rounded-lg bg-gradient-to-r from-veil-violet to-veil-cyan px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
          >
            Issue token
          </button>
        </div>
      </Modal>
    </div>
  );
}
