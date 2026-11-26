import { Mail, MapPin, Phone, RotateCw, User, X } from 'lucide-react';
import type { Identity } from '../types';

const KIND_META = {
  email: { icon: Mail, label: 'Email alias' },
  phone: { icon: Phone, label: 'Phone alias' },
  name: { icon: User, label: 'Name alias' },
  address: { icon: MapPin, label: 'Address alias' },
} as const;

export function IdentityCard({
  identity,
  onRotate,
  onRevoke,
}: {
  identity: Identity;
  onRotate: (id: string) => void;
  onRevoke: (id: string) => void;
}) {
  const { icon: Icon, label } = KIND_META[identity.kind];
  const revoked = identity.status === 'revoked';
  return (
    <div className={`glass rounded-2xl p-5 transition-opacity ${revoked ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${revoked ? 'bg-veil-red/15 text-veil-red' : 'bg-veil-cyan/15 text-veil-cyan'}`}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-0.5 truncate font-mono text-sm font-semibold text-white">{identity.alias}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1 ${
            revoked ? 'bg-veil-red/10 text-veil-red ring-veil-red/30' : 'bg-veil-green/10 text-veil-green ring-veil-green/30'
          }`}
        >
          {identity.status}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {identity.used_by.length === 0 ? 'Not used by any agent yet' : `Used by ${identity.used_by.join(', ')}`}
      </p>
      <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
        <button
          type="button"
          disabled={revoked}
          onClick={() => onRotate(identity.id)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-veil-cyan/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCw className="h-3.5 w-3.5" /> Rotate
        </button>
        <button
          type="button"
          disabled={revoked}
          onClick={() => onRevoke(identity.id)}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-veil-red/30 bg-veil-red/10 px-3 py-1.5 text-xs font-medium text-veil-red transition-colors hover:bg-veil-red/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <X className="h-3.5 w-3.5" /> Revoke
        </button>
      </div>
    </div>
  );
}
