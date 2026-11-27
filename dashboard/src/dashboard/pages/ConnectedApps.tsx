import { useEffect, useState } from 'react';
import { useStore } from '../store';
import * as api from '../api';
import type { ConnectedApp } from '../types';
import { Link } from 'react-router-dom';
import { Shield, Link2, WifiOff, Activity, Mail, Calendar, HardDrive, ShoppingBag } from 'lucide-react';

const APP_ICONS: Record<string, typeof Shield> = {
  gmail: Mail,
  calendar: Calendar,
  drive: HardDrive,
  slack: Activity,
  store: ShoppingBag,
};

export function ConnectedApps() {
  const { connectedApps, connectApp, disconnectApp, mode } = useStore();
  const [connecting, setConnecting] = useState<Set<string>>(new Set());

  const appIcons: Record<string, React.ElementType> = APP_ICONS;

  const connectedCount = connectedApps.filter((a) => a.status === 'connected').length;

  const handleConnect = async (id: string) => {
    setConnecting((prev) => new Set(prev).add(id));
    await api.connectApp(id);
    connectApp(id);
    setConnecting((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDisconnect = async (id: string) => {
    setConnecting((prev) => new Set(prev).add(id));
    await api.disconnectApp(id);
    disconnectApp(id);
    setConnecting((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Connected apps</h2>
        <p className="mt-1 text-sm text-slate-400">
          Authorize the services your agents can reach. VEIL seals credentials in the vault and
          applies privacy rules to every request.
        </p>
      </div>

      {/* Connection summary strip */}
      <div className="glass overflow-hidden rounded-2xl border border-white/5">
        <div className="border-b border-white/5 px-5 py-4 sm:px-6 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white">Connection status</h3>
            <p className="text-xs text-slate-500">
              {connectedCount} of {connectedApps.length} apps connected to VEIL
            </p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            connectedCount === connectedApps.length
              ? 'bg-veil-green/10 text-veil-green border border-veil-green/20'
              : 'bg-veil-amber/10 text-veil-amber border border-veil-amber/20'
          }`}>
            {connectedCount}/{connectedApps.length}
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {connectedApps.map((app) => {
            const Icon = appIcons[app.id] ?? Shield;
            const connected = app.status === 'connected';
            const busy = connecting.has(app.id);
            return (
              <div
                key={app.id}
                className="flex items-center justify-between px-5 py-4 sm:px-6 transition-colors hover:bg-white/3"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                      connected
                        ? 'border-veil-green/30 bg-veil-green/10'
                        : busy
                          ? 'border-veil-cyan/40 bg-veil-cyan/10'
                          : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {connected ? (
                      <Shield className="h-5 w-5 text-veil-green" />
                    ) : busy ? (
                      <span className="h-5 w-5 rounded-full border-2 border-veil-cyan/30 border-t-veil-cyan animate-spin" />
                    ) : (
                      <Link2 className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{app.name}</p>
                    <p className="text-xs text-slate-500">
                      {connected
                        ? `Connected ${new Date(app.connected_at).toLocaleDateString()} · {app.agents_using} agent(s) using`
                        : 'Not connected — click to authorize'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {connected ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDisconnect(app.id)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-white/5 hover:text-white disabled:opacity-50"
                    >
                      {busy ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleConnect(app.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-default ${
                        busy
                          ? 'bg-white/5 text-slate-500'
                          : 'bg-gradient-to-r from-veil-violet to-veil-cyan text-white hover:scale-[1.03]'
                      }`}
                    >
                      {busy ? 'Connecting…' : 'Connect'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What happens when connected */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            title: 'Credentials sealed',
            body: 'OAuth tokens and passwords never reach your agents. VEIL holds them in an encrypted vault.',
            icon: Shield,
          },
          {
            title: 'Per-app privacy rules',
            body: 'Each connected app gets its own allow / mask / ask / deny policy per agent.',
            icon: Activity,
          },
          {
            title: 'Revoke anytime',
            body: 'Disconnect an app and all its tokens are invalidated immediately.',
            icon: WifiOff,
          },
        ].map((item, i) => (
          <GlassCard
            key={item.title}
            className="p-5"
            title={item.title}
            body={item.body}
            icon={item.icon}
          />
        ))}
      </div>

      <div className="glass rounded-2xl p-5 sm:p-6">
        <p className="text-sm text-slate-400 mb-4">
          This is a demo. No real credentials are stored. Connecting an app here simulates
          authorizing VEIL to act on your behalf with privacy rules applied.
        </p>
        <Link to="/" className="inline-flex items-center gap-1 text-xs font-medium text-veil-cyan hover:text-white">
          <Link2 className="h-3 w-3" /> Back to website
        </Link>
      </div>
    </div>
  );
}

function GlassCard({
  className,
  title,
  body,
  icon: Icon,
}: {
  className?: string;
  title: string;
  body: string;
  icon: React.ElementType;
}) {
  return (
    <div className={`glass rounded-xl p-5 border border-white/5 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 mb-3">
        <Icon className="h-4 w-4 text-slate-400" />
      </div>
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
    </div>
  );
}
