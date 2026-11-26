import { Check, ShieldAlert, X } from 'lucide-react';
import type { Approval } from '../types';

/** Pending approval card with Approve / Approve once / Deny. */
export function ApprovalCard({
  approval,
  onDecide,
}: {
  approval: Approval;
  onDecide: (decision: 'approved' | 'denied') => void;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-veil-amber/15 text-veil-amber">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">
            {approval.agent} wants to <span className="text-veil-amber">{approval.action}</span> on {approval.app}
          </p>
          <p className="mt-1 text-sm text-slate-400">{approval.details}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Data to release</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {approval.data_to_release.map((d) => (
              <span key={d} className="rounded-full border border-veil-cyan/30 bg-veil-cyan/10 px-2.5 py-0.5 text-xs text-veil-cyan">
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
        <button
          type="button"
          onClick={() => onDecide('approved')}
          className="inline-flex items-center gap-1.5 rounded-full bg-veil-green/20 px-4 py-2 text-xs font-semibold text-veil-green ring-1 ring-veil-green/40 transition-colors hover:bg-veil-green/30"
        >
          <Check className="h-3.5 w-3.5" /> Approve
        </button>
        <button
          type="button"
          onClick={() => onDecide('approved')}
          className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-veil-cyan/50 hover:text-white"
        >
          Approve once
        </button>
        <button
          type="button"
          onClick={() => onDecide('denied')}
          className="inline-flex items-center gap-1.5 rounded-full bg-veil-red/20 px-4 py-2 text-xs font-semibold text-veil-red ring-1 ring-veil-red/40 transition-colors hover:bg-veil-red/30"
        >
          <X className="h-3.5 w-3.5" /> Deny
        </button>
      </div>
    </div>
  );
}
