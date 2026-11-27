import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Ban, ChevronDown, Eye, ShieldOff, X } from 'lucide-react';
import type { VeilEvent } from '../types';

/**
 * One collapsible banner that groups all undismissed blocked events.
 * Shows a count, the most recent event's agent/app/tool, and expands
 * to list every blocked event. Dismissing clears the whole group.
 */
export function GroupedAlertBanner({
  events,
  onView,
  onRevoke,
  onDismissAll,
}: {
  events: VeilEvent[];
  onView: (e: VeilEvent) => void;
  onRevoke: (agentName: string) => void;
  onDismissAll: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (events.length === 0) return null;
  const latest = events[0];
  const count = events.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      role="alert"
      className="rounded-2xl border border-veil-red/40 bg-veil-red/10 shadow-lg shadow-veil-red/10"
    >
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <ShieldOff className="h-5 w-5 shrink-0 text-veil-red" />
        <p className="min-w-0 flex-1 text-sm font-medium text-veil-red">
          <span className="font-bold">{count}</span> blocked request{count > 1 ? 's' : ''} in the last 5 min —
          latest: <span className="font-bold">{latest.agent}</span> tried{' '}
          <span className="font-bold">{latest.tool}</span> on {latest.app}. Blocked.
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onView(latest)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-veil-cyan/50 hover:text-white"
          >
            <Eye className="h-3.5 w-3.5" /> View events
          </button>
          <button
            type="button"
            onClick={() => onRevoke(latest.agent)}
            className="inline-flex items-center gap-1.5 rounded-full bg-veil-red px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
          >
            <Ban className="h-3.5 w-3.5" /> Revoke agent
          </button>
          {count > 1 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
          <button
            type="button"
            onClick={onDismissAll}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Dismiss all alerts"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && count > 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ul className="divide-y divide-veil-red/10 border-t border-veil-red/20">
              {events.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-veil-red" />
                  <span className="text-sm font-medium text-veil-red">{e.agent}</span>
                  <span className="text-sm text-slate-400">{e.app} · {e.tool}</span>
                  <button
                    type="button"
                    onClick={() => onView(e)}
                    className="ml-auto text-xs font-medium text-slate-300 underline-offset-2 hover:text-white hover:underline"
                  >
                    inspect
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
