import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Eye, Lock, Shield, X } from 'lucide-react';
import { solution } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GlassCard } from './ui/GlassCard';

/** A single audit-log row that ticks in. */
type LogRow = { time: string; agent: string; action: string; status: 'masked' | 'allowed' | 'blocked' };

const SEED_LOG: LogRow[] = [
  { time: '10:42', agent: 'Assistant-1', action: 'Read Gmail inbox', status: 'masked' },
  { time: '10:41', agent: 'Planner', action: 'Read Calendar events', status: 'allowed' },
  { time: '10:38', agent: 'Shopper-Bot', action: 'Store checkout', status: 'masked' },
  { time: '10:35', agent: 'Unknown-Agent', action: 'Download all Drive', status: 'blocked' },
  { time: '10:30', agent: 'Assistant-1', action: 'Send email', status: 'masked' },
];

const STATUS_STYLE: Record<LogRow['status'], string> = {
  masked: 'text-veil-cyan bg-veil-cyan/10',
  allowed: 'text-veil-green bg-veil-green/10',
  blocked: 'text-veil-red bg-veil-red/10',
};

/** Live audit log that cycles through rows. */
function LiveAuditLog() {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<LogRow[]>(SEED_LOG);

  useEffect(() => {
    if (reduce) return;
    const actions = ['Read Gmail inbox', 'Read Calendar events', 'Store checkout', 'Download all Drive', 'Send email'];
    const agents = ['Assistant-1', 'Planner', 'Shopper-Bot'];
    const statuses: LogRow['status'][] = ['masked', 'allowed', 'blocked'];
    const id = setInterval(() => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const row: LogRow = {
        time,
        agent: agents[Math.floor(Math.random() * agents.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
      };
      setRows((prev) => [row, ...prev].slice(0, 6));
    }, 3000);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <motion.span
          className="h-2 w-2 rounded-full bg-veil-green"
          animate={reduce ? undefined : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Audit log</span>
        <span className="ml-auto text-[10px] text-veil-green">live</span>
      </div>
      <ul className="mt-2 space-y-1.5">
        <AnimatePresence initial={false}>
          {rows.map((row, i) => (
            <motion.li
              key={`${row.time}-${row.agent}-${i}`}
              layout
              initial={{ opacity: 0, height: 0, x: -12 }}
              animate={{ opacity: 1, height: 'auto', x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-xs"
            >
              <span className="tabular-nums text-slate-600">{row.time}</span>
              <span className="font-medium text-slate-300">{row.agent}</span>
              <span className="truncate text-slate-500">{row.action}</span>
              <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${STATUS_STYLE[row.status]}`}>
                {row.status}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/** The "With VEIL" panel: aliases, masked fields, live audit log. */
function WithVeilPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="space-y-3"
    >
      <div className="rounded-xl border border-veil-green/25 bg-veil-green/[0.05] p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-veil-green" />
          <p className="text-xs font-semibold uppercase tracking-wider text-veil-green">{solution.after.label}</p>
        </div>
        <p className="mt-1 text-sm font-semibold text-white">{solution.after.line}</p>
        <ul className="mt-3 space-y-1.5">
          {solution.after.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-xs text-slate-300">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-veil-green" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Masked data preview */}
      <div className="glass rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Agent receives</p>
        <div className="mt-2 space-y-1.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">name</span>
            <span className="rounded border border-veil-cyan/30 bg-veil-cyan/10 px-1.5 py-0.5 text-veil-cyan">[NAME_1]</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">email</span>
            <span className="text-veil-green">aarav.shop@veil.alias</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">card</span>
            <span className="rounded border border-veil-cyan/30 bg-veil-cyan/10 px-1.5 py-0.5 text-veil-cyan">[CARD_1]</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">phone</span>
            <span className="rounded border border-veil-cyan/30 bg-veil-cyan/10 px-1.5 py-0.5 text-veil-cyan">[PHONE_1]</span>
          </div>
        </div>
      </div>

      <LiveAuditLog />
    </motion.div>
  );
}

/** The "Without VEIL" panel: raw data exposed. */
function WithoutVeilPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35 }}
      className="space-y-3"
    >
      <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.04] p-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-rose-400" />
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">{solution.before.label}</p>
        </div>
        <p className="mt-1 text-sm font-semibold text-white">{solution.before.line}</p>
        <ul className="mt-3 space-y-1.5">
          {solution.before.points.map((p) => (
            <li key={p} className="flex items-start gap-2 text-xs text-slate-400">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {/* Raw data preview */}
      <div className="glass rounded-xl p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Agent receives</p>
        <div className="mt-2 space-y-1.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">name</span>
            <span className="rounded bg-rose-400/15 px-1.5 py-0.5 text-rose-300">Rahul Kapoor</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">email</span>
            <span className="rounded bg-rose-400/15 px-1.5 py-0.5 text-rose-300">rahul@gmail.com</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">card</span>
            <span className="rounded bg-rose-400/15 px-1.5 py-0.5 text-rose-300">4111 1111 1111 1111</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600">phone</span>
            <span className="rounded bg-rose-400/15 px-1.5 py-0.5 text-rose-300">+91 98765 43210</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">No audit log</span>
          <span className="ml-auto text-[10px] text-rose-400">no record</span>
        </div>
        <p className="mt-3 text-xs text-slate-500">You have no way to see what the agent read, sent, or stored.</p>
      </div>
    </motion.div>
  );
}

export function Solution() {
  const [withVeil, setWithVeil] = useState(true);
  const reduce = useReducedMotion();

  return (
    <section id="solution" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={solution.eyebrow} title={solution.title} body={solution.body} />

        {/* Toggle */}
        <Reveal delay={0.12} className="mt-10 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
            <button
              type="button"
              onClick={() => setWithVeil(false)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                !withVeil ? 'bg-rose-400/20 text-rose-300 ring-1 ring-rose-400/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="mr-1.5 inline h-3.5 w-3.5" />
              Without VEIL
            </button>
            <button
              type="button"
              onClick={() => setWithVeil(true)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                withVeil ? 'bg-veil-green/20 text-veil-green ring-1 ring-veil-green/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="mr-1.5 inline h-3.5 w-3.5" />
              With VEIL
            </button>
          </div>
        </Reveal>

        {/* Panel */}
        <Reveal delay={0.18} className="mt-8">
          <GlassCard gradientBorder className="relative overflow-hidden p-5 sm:p-7">
            {/* Toggle indicator glow */}
            <div
              className={`pointer-events-none absolute -top-20 h-40 w-40 rounded-full blur-3xl transition-colors duration-500 ${
                withVeil ? 'left-1/3 bg-veil-green/15' : 'left-1/3 bg-rose-400/15'
              }`}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                {withVeil ? <Shield className="h-4 w-4 text-veil-green" /> : <Lock className="h-4 w-4 text-rose-400" />}
                <span className={`text-sm font-semibold ${withVeil ? 'text-veil-green' : 'text-rose-300'}`}>
                  {withVeil ? 'With VEIL' : 'Without VEIL'}
                </span>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Eye className="h-3.5 w-3.5" /> Toggle to compare
              </span>
            </div>

            <div className="relative mt-5 min-h-[320px]">
              <AnimatePresence mode="wait">
                {withVeil ? <WithVeilPanel key="with" /> : <WithoutVeilPanel key="without" />}
              </AnimatePresence>
            </div>

            {/* Decorative flowing packet when withVeil */}
            {!reduce && withVeil && (
              <motion.div
                className="pointer-events-none absolute bottom-4 left-4 h-1.5 w-1.5 rounded-full bg-veil-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                animate={{ x: [0, 300, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
