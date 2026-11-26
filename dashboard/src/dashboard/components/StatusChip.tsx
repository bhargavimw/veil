import { motion } from 'framer-motion';
import type { Status } from '../types';

const TONES = {
  allowed: { bg: 'bg-veil-green/15', text: 'text-veil-green', ring: 'ring-veil-green/30', dot: 'bg-veil-green' },
  masked: { bg: 'bg-veil-cyan/15', text: 'text-veil-cyan', ring: 'ring-veil-cyan/30', dot: 'bg-veil-cyan' },
  approval_needed: { bg: 'bg-veil-amber/15', text: 'text-veil-amber', ring: 'ring-veil-amber/30', dot: 'bg-veil-amber' },
  blocked: { bg: 'bg-veil-red/15', text: 'text-veil-red', ring: 'ring-veil-red/30', dot: 'bg-veil-red' },
} as const;

export function StatusChip({ status }: { status: Status }) {
  const t = TONES[status];
  const label = status.replace('_', ' ');
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${t.bg} ${t.text} ${t.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {label}
    </span>
  );
}

export function ToastStack() {
  return null; // rendered by <Toasts/> in layout
}

export function ToastItem({ text, tone, onClose }: { text: string; tone: 'success' | 'danger' | 'info'; onClose: () => void }) {
  const colors =
    tone === 'success'
      ? 'border-veil-green/40 bg-veil-green/10 text-veil-green'
      : tone === 'danger'
        ? 'border-veil-red/40 bg-veil-red/10 text-veil-red'
        : 'border-veil-cyan/40 bg-veil-cyan/10 text-veil-cyan';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      className={`pointer-events-auto rounded-xl border px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-xl ${colors}`}
    >
      <div className="flex items-center gap-3">
        <span>{text}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded px-1 text-slate-400 transition-colors hover:text-white"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </motion.div>
  );
}
