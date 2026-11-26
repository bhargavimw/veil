import { useState } from 'react';
import { Mail, MapPin, Phone, Plus, User } from 'lucide-react';
import { useStore } from '../store';
import { IdentityCard } from '../components/IdentityCard';
import { Modal } from '../components/Modal';
import type { IdentityKind } from '../types';

const KINDS: { kind: IdentityKind; label: string; icon: typeof Mail }[] = [
  { kind: 'email', label: 'Email', icon: Mail },
  { kind: 'phone', label: 'Phone', icon: Phone },
  { kind: 'name', label: 'Name', icon: User },
  { kind: 'address', label: 'Address', icon: MapPin },
];

export function Identities() {
  const { identities, createIdentity, revokeIdentity, pushToast } = useStore();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<IdentityKind>('email');

  const email = identities.find((i) => i.kind === 'email' && i.status === 'active');
  const address = identities.find((i) => i.kind === 'address' && i.status === 'active');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Virtual identities</h2>
          <p className="mt-1 text-sm text-slate-400">Aliases apps and agents see instead of your real details.</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-veil-violet to-veil-cyan px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-veil-violet/20 transition-transform hover:scale-[1.03]"
        >
          <Plus className="h-4 w-4" /> Create alias
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {identities.map((i) => (
          <IdentityCard key={i.id} identity={i} onRevoke={revokeIdentity} onRotate={() => pushToast('Alias rotated. The old value stops working immediately.', 'success')} />
        ))}
      </div>

      <div className="glass rounded-2xl p-5 sm:p-6">
        <h3 className="font-semibold text-white">What an app sees</h3>
        <p className="text-xs text-slate-500">Side-by-side comparison of what leaves your device vs what arrives.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-veil-red/20 bg-veil-red/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-veil-red">Without VEIL</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
              <li>aarav@gmail.com</li>
              <li>+91 98765 43210</li>
              <li>42 Rose Lane, Springfield</li>
            </ul>
          </div>
          <div className="rounded-xl border border-veil-cyan/20 bg-veil-cyan/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-veil-cyan">With VEIL</p>
            <ul className="mt-2 space-y-1.5 font-mono text-sm text-veil-cyan">
              <li>{email?.alias ?? 'aarav.shop@veil.alias'}</li>
              <li>+91 00000 00000</li>
              <li>{address?.alias ?? '12 Layer-2 Lane'}</li>
            </ul>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Create alias">
        <div className="space-y-4">
          <div>
            <label htmlFor="alias-kind" className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kind</label>
            <select
              id="alias-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as IdentityKind)}
              className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-200 focus:border-veil-cyan/40 focus:outline-none"
            >
              {KINDS.map((k) => <option key={k.kind} value={k.kind}>{k.label}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              createIdentity(kind);
              setOpen(false);
              pushToast(`New ${kind} alias created.`, 'success');
            }}
            className="w-full rounded-lg bg-gradient-to-r from-veil-violet to-veil-cyan px-4 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.01]"
          >
            Create
          </button>
        </div>
      </Modal>
    </div>
  );
}
