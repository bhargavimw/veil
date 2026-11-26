import { motion, useReducedMotion } from 'framer-motion';
import { Bot, Fingerprint, Filter, ScrollText, Wrench } from 'lucide-react';
import { howItWorks } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GlassCard } from './ui/GlassCard';

const stepIcons = [Fingerprint, Wrench, Filter, ScrollText];

/** A packet traveling Agent → VEIL → MCP apps, losing its sensitive payload. */
function Pipeline() {
  const reduce = useReducedMotion();
  return (
    <GlassCard gradientBorder className="overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center">
        {/* Agent */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-veil-violet/30 bg-veil-violet/10">
            <Bot className="h-6 w-6 text-veil-violet" />
          </div>
          <span className="text-xs font-medium text-slate-300">Agent</span>
        </div>

        {/* wire + packet */}
        <div className="relative h-10 flex-1 md:h-8">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-veil-violet/50 via-veil-cyan/50 to-veil-green/50" />
          <motion.div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-veil-cyan shadow-[0_0_12px_rgba(34,211,238,0.8)]"
            initial={{ left: '0%' }}
            whileInView={reduce ? { left: '100%' } : { left: ['0%', '100%'] }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 2.4, repeat: reduce ? 0 : Infinity, ease: 'linear' }}
          />
          <div className="absolute left-1/2 top-0 hidden -translate-x-1/2 md:block">
            <span className="rounded-full border border-veil-cyan/30 bg-ink-soft px-2 py-0.5 text-[10px] text-veil-cyan">
              sensitive parts replaced
            </span>
          </div>
        </div>

        {/* VEIL */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-gradient bg-gradient-to-b from-veil-cyan/15 to-veil-violet/10">
            <Filter className="h-6 w-6 text-veil-cyan" />
          </div>
          <span className="text-xs font-semibold text-white">VEIL</span>
        </div>

        <div className="relative h-10 flex-1 md:h-8">
          <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-veil-green/50 to-veil-cyan/50" />
          <motion.div
            className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-veil-green shadow-[0_0_12px_rgba(52,211,153,0.8)]"
            initial={{ left: '0%' }}
            whileInView={reduce ? { left: '100%' } : { left: ['0%', '100%'] }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 2.4, repeat: reduce ? 0 : Infinity, ease: 'linear', delay: 0.3 }}
          />
        </div>

        {/* MCP apps */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-veil-green/30 bg-veil-green/10">
            <div className="flex gap-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-veil-green" />
              <span className="h-1.5 w-1.5 rounded-full bg-veil-green/60" />
              <span className="h-1.5 w-1.5 rounded-full bg-veil-green/30" />
            </div>
          </div>
          <span className="text-xs font-medium text-slate-300">MCP apps</span>
        </div>
      </div>

      {/* example transformation */}
      <div className="mt-6 flex flex-col gap-2 rounded-xl border border-white/5 bg-ink-soft/60 p-4 font-mono text-xs sm:flex-row sm:items-center sm:gap-4">
        <span className="text-slate-500">in:</span>
        <span className="text-rose-300 line-through">4111 1111 1111 1111</span>
        <span className="text-slate-500">→ out:</span>
        <span className="text-veil-green">[CARD_1]</span>
      </div>
    </GlassCard>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={howItWorks.eyebrow} title={howItWorks.title} />
        <Reveal delay={0.15} className="mt-14">
          <Pipeline />
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.steps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <Reveal key={step.title} delay={i * 0.08}>
                <GlassCard className="h-full p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-veil-cyan/20 bg-veil-cyan/10">
                      <Icon className="h-5 w-5 text-veil-cyan" />
                    </div>
                    <span className="text-2xl font-bold text-white/10">{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={0.3} className="mt-8 text-center">
          <p className="text-sm text-slate-400">{howItWorks.footer}</p>
        </Reveal>
      </div>
    </section>
  );
}
