import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Fingerprint,
  Filter,
  KeyRound,
  LineChart,
  Minimize2,
  Shield,
} from 'lucide-react';
import { features } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

const icons = [Fingerprint, Filter, KeyRound, LineChart, Minimize2];

/* ---------- looping mini-visuals ---------- */

/** Tokenisation: raw value cycles to a masked token. */
function TokeniseVisual({ reduce }: { reduce: boolean }) {
  const [masked, setMasked] = useState(false);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setMasked((v) => !v), 2000);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <div className="rounded-lg border border-white/5 bg-ink-soft/60 p-3 font-mono text-xs">
      <div className="flex items-center gap-2">
        <span className="text-slate-600">in</span>
        <motion.span
          key={masked ? 'masked' : 'raw'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={masked ? 'text-veil-cyan' : 'text-rose-300'}
        >
          {masked ? '[CARD_1]' : '4111 1111 1111 1111'}
        </motion.span>
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="text-slate-600">out</span>
        <span className="rounded border border-veil-cyan/30 bg-veil-cyan/10 px-1.5 py-0.5 text-veil-cyan">
          {masked ? '[CARD_1]' : '•••• •••• •••• 1111'}
        </span>
      </div>
    </div>
  );
}

/** Permission toggles: allow/mask/ask/deny cycle. */
function PermissionVisual({ reduce }: { reduce: boolean }) {
  const opts = ['allow', 'mask', 'ask', 'deny'] as const;
  const [sel, setSel] = useState(1);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setSel((s) => (s + 1) % 4), 1800);
    return () => clearInterval(id);
  }, [reduce]);
  const colors = ['text-veil-green', 'text-veil-cyan', 'text-veil-amber', 'text-veil-red'];
  return (
    <div className="rounded-lg border border-white/5 bg-ink-soft/60 p-3">
      <p className="mb-2 font-mono text-[10px] text-slate-500">gmail.read_inbox</p>
      <div className="flex gap-1.5">
        {opts.map((o, i) => (
          <div key={o} className="flex flex-1 flex-col items-center gap-1">
            <motion.div
              className={`h-2 w-2 rounded-full ${i === sel ? colors[i].replace('text', 'bg') : 'bg-slate-700'}`}
              animate={i === sel && !reduce ? { scale: [1, 1.4, 1] } : {}}
              transition={{ duration: 0.4 }}
            />
            <span className={`text-[9px] ${i === sel ? colors[i] : 'text-slate-600'}`}>{o}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mode switch: Restricted / Flexible / Unrestricted. */
function ModeVisual({ reduce }: { reduce: boolean }) {
  const modes = ['Restricted', 'Flexible', 'Unrestricted'] as const;
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % 3), 2200);
    return () => clearInterval(id);
  }, [reduce]);
  const colors = ['text-veil-green', 'text-veil-cyan', 'text-veil-amber'];
  return (
    <div className="rounded-lg border border-white/5 bg-ink-soft/60 p-3">
      <div className="flex gap-1.5">
        {modes.map((m, i) => (
          <div
            key={m}
            className={`flex-1 rounded-md px-2 py-1.5 text-center text-[10px] font-semibold transition-all ${
              i === idx ? `${colors[i]} bg-white/5 ring-1 ring-white/10` : 'text-slate-600'
            }`}
          >
            {m}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Original vs sent log: side-by-side rows. */
function LogVisual({ reduce }: { reduce: boolean }) {
  const rows = [
    { original: 'Rahul K.', sent: '[NAME_1]' },
    { original: 'rahul@gmail.com', sent: 'alias.mail@veil.alias' },
    { original: '4111 1111...', sent: '[CARD_1]' },
  ];
  return (
    <div className="rounded-lg border border-white/5 bg-ink-soft/60 p-3 font-mono text-[10px]">
      {rows.map((r, i) => (
        <motion.div
          key={i}
          className="flex items-center gap-2 py-0.5"
          animate={reduce ? undefined : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
        >
          <span className="w-24 truncate text-rose-300/70">{r.original}</span>
          <span className="text-slate-600">→</span>
          <span className="text-veil-cyan">{r.sent}</span>
        </motion.div>
      ))}
    </div>
  );
}

/** Alias generator: cycles through generated aliases. */
function AliasVisual({ reduce }: { reduce: boolean }) {
  const aliases = ['aarav.shop@veil.alias', '+91 00000 00000', 'A. Sharma', '12 Layer-2 Lane'];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % aliases.length), 2000);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <div className="rounded-lg border border-white/5 bg-ink-soft/60 p-3">
      <div className="flex items-center gap-2">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-mono text-xs text-veil-green"
        >
          {aliases[idx]}
        </motion.span>
        <motion.span
          className="ml-auto text-[9px] text-slate-600"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          generating…
        </motion.span>
      </div>
    </div>
  );
}

const visuals = [TokeniseVisual, PermissionVisual, ModeVisual, LogVisual, AliasVisual];

export function Features() {
  const reduce = useReducedMotion() ?? false;
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={features.eyebrow} title={features.title} />

        {/* Bento grid: 5 cards, last one spans 2 cols on sm */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.items.map((item, i) => {
            const Icon = icons[i];
            const Visual = visuals[i];
            return (
              <Reveal
                key={item.title}
                delay={i * 0.08}
                className={i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}
              >
                <div className="group relative h-full overflow-hidden rounded-2xl border border-white/9 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-veil-cyan/20">
                  {/* Hover glow */}
                  <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-veil-violet/0 blur-3xl transition-all duration-500 group-hover:bg-veil-violet/15" />
                  {/* Gradient border on hover */}
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(34,211,238,0.3))',
                      padding: '1px',
                      WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    }}
                  />

                  <div className="relative">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-veil-violet/25 bg-veil-violet/10 transition-colors group-hover:border-veil-cyan/30 group-hover:bg-veil-cyan/10">
                      <Icon className="h-5 w-5 text-veil-violet transition-colors group-hover:text-veil-cyan" />
                    </div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>

                    {/* Mini visual */}
                    <div className="mt-4">
                      <Visual reduce={reduce} />
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}

          {/* Extra bento card: "Every action audited" */}
          <Reveal delay={0.4} className="sm:col-span-2 lg:col-span-2">
            <div className="group relative h-full overflow-hidden rounded-2xl border border-white/9 bg-gradient-to-r from-veil-violet/[0.08] to-veil-cyan/[0.05] p-6 transition-all duration-300 hover:border-veil-cyan/20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-veil-green/25 bg-veil-green/10">
                    <Shield className="h-5 w-5 text-veil-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Every action, audited</h3>
                    <p className="mt-1 text-sm text-slate-400">A live record of what every agent saw, sent, and was denied.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  {['allowed', 'masked', 'approval', 'blocked'].map((s) => {
                    const colors: Record<string, string> = {
                      allowed: 'border-veil-green/30 text-veil-green',
                      masked: 'border-veil-cyan/30 text-veil-cyan',
                      approval: 'border-veil-amber/30 text-veil-amber',
                      blocked: 'border-veil-red/30 text-veil-red',
                    };
                    return (
                      <span key={s} className={`rounded-full border bg-white/5 px-3 py-1 text-xs font-medium ${colors[s]}`}>
                        {s}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
