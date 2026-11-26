import { motion, useReducedMotion } from 'framer-motion';
import { Check, Shield, X } from 'lucide-react';
import { solution } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

/** The big reveal: a translucent veil of light between person and orb. */
function VeilIllustration() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto flex w-full max-w-xl items-center justify-between gap-4 py-8">
      {/* person */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-ink-soft">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="8" r="4" stroke="#94A3B8" strokeWidth="2" />
            <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-400">You</span>
      </div>

      {/* the veil */}
      <div className="relative h-28 flex-1">
        <motion.div
          initial={{ opacity: 0, scaleY: 0.4 }}
          whileInView={{ opacity: 1, scaleY: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute inset-y-0 left-1/2 w-24 -translate-x-1/2 rounded-full bg-gradient-to-b from-veil-cyan/25 via-veil-violet/15 to-transparent blur-sm"
        />
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="absolute inset-y-2 left-1/2 flex w-16 -translate-x-1/2 items-center justify-center rounded-2xl border border-veil-cyan/40 bg-veil-cyan/10 backdrop-blur-sm"
        >
          <Shield className={`h-7 w-7 text-veil-cyan ${reduce ? '' : 'animate-pulse-soft'}`} />
        </motion.div>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs uppercase tracking-widest text-veil-cyan">
          The veil
        </span>
      </div>

      {/* orb */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-veil-violet/30 blur-lg" />
          <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-veil-violet to-veil-cyan shadow-[0_0_30px_rgba(139,92,246,0.5)]" />
        </div>
        <span className="text-xs uppercase tracking-widest text-slate-400">Agent</span>
      </div>
    </div>
  );
}

function CompareStrip() {
  const { before, after } = solution;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Reveal delay={0.1}>
        <div className="h-full rounded-2xl border border-rose-400/20 bg-rose-400/[0.04] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            {before.label}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{before.line}</p>
          <ul className="mt-4 space-y-2.5">
            {before.points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-slate-400">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
      <Reveal delay={0.2}>
        <div className="h-full rounded-2xl border border-veil-green/25 bg-veil-green/[0.05] p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-veil-green">
            {after.label}
          </p>
          <p className="mt-2 text-lg font-semibold text-white">{after.line}</p>
          <ul className="mt-4 space-y-2.5">
            {after.points.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-veil-green" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  );
}

export function Solution() {
  return (
    <section id="solution" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={solution.eyebrow} title={solution.title} body={solution.body} />
        <Reveal delay={0.15} className="mt-12">
          <VeilIllustration />
        </Reveal>
        <div className="mt-16">
          <CompareStrip />
        </div>
      </div>
    </section>
  );
}
