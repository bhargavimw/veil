import { Ban, Eye, Shield, ShieldOff, X } from 'lucide-react';

/** Red alert banner for blocked events. */
export function AlertBanner({
  agent,
  message,
  onView,
  onRevoke,
  onDismiss,
}: {
  agent: string;
  message: string;
  onView: () => void;
  onRevoke: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-2xl border border-veil-red/40 bg-veil-red/10 px-4 py-3 shadow-lg shadow-veil-red/10"
    >
      <ShieldOff className="h-5 w-5 shrink-0 text-veil-red" />
      <p className="min-w-0 flex-1 text-sm font-medium text-veil-red">
        <span className="font-bold">{agent}</span> {message}
      </p>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-veil-cyan/50 hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" /> View event
        </button>
        <button
          type="button"
          onClick={onRevoke}
          className="inline-flex items-center gap-1.5 rounded-full bg-veil-red px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
        >
          <Ban className="h-3.5 w-3.5" /> Revoke agent
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss alert"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export { Shield };
