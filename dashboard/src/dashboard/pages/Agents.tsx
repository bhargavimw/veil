import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ban, Bot, Pause, Play } from 'lucide-react';
import { useStore } from '../store';
import { PermissionMatrix } from '../components/PermissionMatrix';
import { ScoreRing } from '../components/ScoreRing';
import type { Agent as AgentT, PermissionValue } from '../types';

const STATUS_STYLE = {
  active: 'bg-veil-green/10 text-veil-green ring-veil-green/30',
  paused: 'bg-veil-amber/10 text-veil-amber ring-veil-amber/30',
  revoked: 'bg-veil-red/10 text-veil-red ring-veil-red/30',
} as const;

export function Agents() {
  const { agents, setAgentStatus, updatePermission } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(agents[0]?.id ?? null);
  const selected: AgentT | undefined = agents.find((a) => a.id === selectedId) ?? agents[0];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Agents</h2>
        <p className="mt-1 text-sm text-slate-400">Connected AI agents and exactly what each one may do.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {agents.map((a) => (
          <motion.button
            key={a.id}
            type="button"
            layout
            onClick={() => setSelectedId(a.id)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-2xl p-5 text-left transition-all duration-200 ${
              selected?.id === a.id ? 'ring-2 ring-veil-cyan/50' : 'hover:ring-1 hover:ring-white/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-veil-violet/15 text-veil-violet">
                <Bot className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">{a.name}</p>
                <p className="text-xs text-slate-500">Last active: {a.last_active}</p>
              </div>
              <ScoreRing score={a.privacy_score} size={36} />
            </div>
            <span
              className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${STATUS_STYLE[a.status]}`}
            >
              {a.status}
            </span>
          </motion.button>
        ))}
      </div>

      {selected && (
        <motion.div layout className="glass rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-white">{selected.name} permissions</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${STATUS_STYLE[selected.status]}`}>
              {selected.status}
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              {selected.status !== 'paused' && selected.status !== 'revoked' && (
                <button
                  type="button"
                  onClick={() => setAgentStatus(selected.id, 'paused')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-veil-amber/30 bg-veil-amber/10 px-3 py-1.5 text-xs font-medium text-veil-amber transition-colors hover:bg-veil-amber/20"
                >
                  <Pause className="h-3.5 w-3.5" /> Pause
                </button>
              )}
              {selected.status === 'paused' && (
                <button
                  type="button"
                  onClick={() => setAgentStatus(selected.id, 'active')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-veil-green/30 bg-veil-green/10 px-3 py-1.5 text-xs font-medium text-veil-green transition-colors hover:bg-veil-green/20"
                >
                  <Play className="h-3.5 w-3.5" /> Resume
                </button>
              )}
              {selected.status !== 'revoked' && (
                <button
                  type="button"
                  onClick={() => setAgentStatus(selected.id, 'revoked')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-veil-red/30 bg-veil-red/10 px-3 py-1.5 text-xs font-medium text-veil-red transition-colors hover:bg-veil-red/20"
                >
                  <Ban className="h-3.5 w-3.5" /> Revoke
                </button>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Rows are tools, columns are what VEIL should do when the agent uses them. Deny blocks the request outright.
          </p>
          <div className="mt-4">
            <PermissionMatrix agent={selected} onChange={(tool, value: PermissionValue) => updatePermission(selected.id, tool, value)} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
