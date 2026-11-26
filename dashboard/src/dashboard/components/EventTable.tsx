import { ChevronRight } from 'lucide-react';
import type { VeilEvent } from '../types';
import { StatusChip } from './StatusChip';

/** Full event table with sticky header and row hover. */
export function EventTable({ events, onSelect }: { events: VeilEvent[]; onSelect: (e: VeilEvent) => void }) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="max-h-[65vh] overflow-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#0D142B] text-[11px] uppercase tracking-wider text-slate-500">
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="px-4 py-3 font-medium">App</th>
              <th className="px-4 py-3 font-medium">Tool</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">PII types</th>
              <th className="px-4 py-3" aria-label="Open" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {events.map((ev) => (
              <tr
                key={ev.id}
                onClick={() => onSelect(ev)}
                className="cursor-pointer transition-colors hover:bg-white/[0.04]"
              >
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-400">
                  {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-4 py-3 font-medium text-white">{ev.agent}</td>
                <td className="px-4 py-3 text-slate-300">{ev.app}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{ev.tool}</td>
                <td className="px-4 py-3"><StatusChip status={ev.status} /></td>
                <td className="px-4 py-3">
                  {ev.pii_found.length === 0 ? (
                    <span className="text-slate-600">—</span>
                  ) : (
                    <span className="flex flex-wrap gap-1">
                      {ev.pii_found.map((p) => (
                        <span key={p} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300">{p}</span>
                      ))}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right"><ChevronRight className="ml-auto h-4 w-4 text-slate-600" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
