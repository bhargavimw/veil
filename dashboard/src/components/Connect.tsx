import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, Link2, Lock, Shield, Zap } from 'lucide-react';
import { connect } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GlassCard } from './ui/GlassCard';

type ConnState = 'idle' | 'authorizing' | 'sealing' | 'rules' | 'ready';

const FLOW: { state: ConnState; label: string }[] = [
  { state: 'authorizing', label: 'Authorizing…' },
  { state: 'sealing', label: 'Credentials sealed in vault' },
  { state: 'rules', label: 'Default privacy rules applied' },
  { state: 'ready', label: 'Ready' },
];

const stepIcons = [Link2, Shield, Zap];

/** A single app tile with a connect animation. */
function AppTile({
  name,
  state,
  onConnect,
}: {
  name: string;
  state: ConnState;
  onConnect: () => void;
}) {
  const connected = state === 'ready';
  const busy = state === 'authorizing' || state === 'sealing' || state === 'rules';
  const flowStep = FLOW.findIndex((f) => f.state === state);

  return (
    <div
      className={`glass relative flex flex-col items-center gap-3 rounded-xl p-4 text-center transition-all duration-300 ${
        connected ? 'ring-1 ring-veil-green/40' : ''
      }`}
    >
      {connected && (
        <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-veil-green shadow-lg shadow-veil-green/30">
          <Shield className="h-3.5 w-3.5 text-ink" />
        </span>
      )}
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-colors ${
          connected
            ? 'border-veil-green/30 bg-veil-green/10'
            : busy
              ? 'border-veil-cyan/40 bg-veil-cyan/10'
              : 'border-white/10 bg-white/5'
        }`}
      >
        {connected ? (
          <Check className="h-5 w-5 text-veil-green" />
        ) : busy ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="h-5 w-5 rounded-full border-2 border-veil-cyan/30 border-t-veil-cyan"
          />
        ) : (
          <Link2 className="h-5 w-5 text-slate-400" />
        )}
      </div>
      <span className="text-sm font-medium text-white">{name}</span>

      <AnimatePresence mode="wait">
        {connected ? (
          <motion.span
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] font-medium text-veil-green"
          >
            Connected
          </motion.span>
        ) : busy ? (
          <motion.span
            key={state}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-veil-cyan"
          >
            {FLOW[flowStep]?.label}
          </motion.span>
        ) : (
          <motion.span key="idle" className="text-[11px] text-slate-500">
            Not connected
          </motion.span>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={onConnect}
        disabled={busy || connected}
        className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:cursor-default ${
          connected
            ? 'bg-veil-green/15 text-veil-green'
            : busy
              ? 'bg-white/5 text-slate-500'
              : 'bg-gradient-to-r from-veil-violet to-veil-cyan text-white hover:scale-[1.04]'
        }`}
      >
        {connected ? 'Ready' : busy ? 'Connecting…' : 'Connect'}
      </button>
    </div>
  );
}

export function Connect() {
  const [states, setStates] = useState<Record<string, ConnState>>({});
  const [copied, setCopied] = useState(false);
  const [connectingAll, setConnectingAll] = useState(false);

  const connectOne = useCallback((id: string) => {
    setStates((prev) => ({ ...prev, [id]: 'authorizing' }));
    setTimeout(() => setStates((prev) => ({ ...prev, [id]: 'sealing' })), 1000);
    setTimeout(() => setStates((prev) => ({ ...prev, [id]: 'rules' })), 2000);
    setTimeout(() => setStates((prev) => ({ ...prev, [id]: 'ready' })), 3000);
  }, []);

  const connectAll = useCallback(() => {
    if (connectingAll) return;
    setConnectingAll(true);
    const apps = connect.apps;
    apps.forEach((app, i) => {
      setTimeout(() => connectOne(app.id), i * 1200);
    });
    setTimeout(() => setConnectingAll(false), apps.length * 1200 + 3200);
  }, [connectingAll, connectOne]);

  const allConnected = connect.apps.every((a) => states[a.id] === 'ready');

  const copyConfig = useCallback(() => {
    void navigator.clipboard?.writeText(connect.configJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <section id="connect" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={connect.eyebrow} title={connect.title} body={connect.subtext} />

        <div className="mt-14 grid gap-8 lg:grid-cols-2 lg:items-start">
          {/* Left: interactive app tiles */}
          <Reveal>
            <GlassCard gradientBorder className="p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">Connect your apps</h3>
                <button
                  type="button"
                  onClick={connectAll}
                  disabled={connectingAll || allConnected}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-veil-violet to-veil-cyan px-4 py-2 text-xs font-semibold text-white transition-transform hover:scale-[1.03] disabled:opacity-50"
                >
                  <Zap className="h-3.5 w-3.5" />
                  {allConnected ? 'All connected' : connectingAll ? 'Connecting…' : 'Connect all'}
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {connect.apps.map((app) => (
                  <AppTile
                    key={app.id}
                    name={app.name}
                    state={states[app.id] ?? 'idle'}
                    onConnect={() => connectOne(app.id)}
                  />
                ))}
              </div>

              {/* Trust chips */}
              <div className="mt-6 flex flex-wrap gap-2 border-t border-white/5 pt-5">
                {connect.trustChips.map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-full border border-veil-green/20 bg-veil-green/5 px-3 py-1 text-xs text-veil-green"
                  >
                    <Lock className="h-3 w-3" />
                    {chip}
                  </span>
                ))}
              </div>
            </GlassCard>
          </Reveal>

          {/* Right: 3-step strip + config card */}
          <div className="space-y-6">
            <Reveal delay={0.1}>
              <ol className="space-y-4">
                {connect.steps.map((step, i) => {
                  const Icon = stepIcons[i];
                  return (
                    <li key={step.title}>
                      <GlassCard className="flex items-start gap-4 p-5">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-veil-cyan/20 bg-veil-cyan/10">
                          <Icon className="h-5 w-5 text-veil-cyan" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-veil-cyan">{i + 1}</span>
                            <h4 className="font-semibold text-white">{step.title}</h4>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-slate-400">{step.body}</p>
                        </div>
                      </GlassCard>
                    </li>
                  );
                })}
              </ol>
            </Reveal>

            <Reveal delay={0.2}>
              <GlassCard className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{connect.configLabel}</p>
                  <button
                    type="button"
                    onClick={copyConfig}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-veil-cyan/50 hover:text-white"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-veil-green" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg border border-white/5 bg-ink-soft/80 p-4 font-mono text-xs leading-relaxed text-slate-300">
{connect.configJson}
                </pre>
              </GlassCard>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
