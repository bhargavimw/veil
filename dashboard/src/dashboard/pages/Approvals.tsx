import { AnimatePresence, motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import { useStore } from '../store';
import { ApprovalCard } from '../components/ApprovalCard';
import { StatusChip } from '../components/StatusChip';
import type { Approval } from '../types';

export function Approvals() {
  const { approvals, decideApproval } = useStore();
  const pending = approvals.filter((a) => a.status === 'pending');
  const history = approvals.filter((a) => a.status !== 'pending');

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Approvals</h2>
        <p className="mt-1 text-sm text-slate-400">Actions agents may only take with your explicit permission.</p>
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {pending.map((a) => (
            <motion.div key={a.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }}>
              <ApprovalCard approval={a} onDecide={(d) => decideApproval(a.id, d)} />
            </motion.div>
          ))}
        </AnimatePresence>
        {pending.length === 0 && (
          <div className="glass flex items-center gap-3 rounded-2xl p-6 text-sm text-slate-400">
            <Check className="h-5 w-5 text-veil-green" />
            Nothing waiting for you — agents are behaving.
          </div>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-white">Past decisions</h3>
        <div className="glass mt-3 divide-y divide-white/5 rounded-2xl">
          {history.length === 0 && (
            <p className="px-5 py-4 text-sm text-slate-500">No decisions yet.</p>
          )}
          {history.map((a: Approval) => (
            <div key={a.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <StatusChip status={a.status === 'approved' ? 'allowed' : 'blocked'} />
              <span className="text-sm font-medium text-white">{a.agent}</span>
              <span className="text-sm text-slate-400">{a.action} on {a.app}</span>
              <span className="ml-auto flex items-center gap-1.5 text-xs tabular-nums text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                {new Date(a.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

