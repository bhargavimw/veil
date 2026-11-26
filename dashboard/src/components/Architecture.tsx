import { ArrowRight, Cable, Lock, MapPin, ShieldCheck } from 'lucide-react';
import { architecture } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GlassCard } from './ui/GlassCard';

const principleIcons = [ShieldCheck, Lock, MapPin];

export function Architecture() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={architecture.eyebrow} title={architecture.title} />

        {/* Diagram */}
        <Reveal delay={0.15} className="mt-14">
          <GlassCard gradientBorder className="p-6 sm:p-10">
            <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-center">
              {/* Agent */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-veil-violet/30 bg-veil-violet/10">
                  <Cable className="h-6 w-6 text-veil-violet" />
                </div>
                <span className="text-sm font-medium text-white">Agent</span>
              </div>

              <ArrowRight className="h-5 w-5 shrink-0 self-center rotate-90 text-slate-600 lg:rotate-0" />

              {/* Gateway */}
              <div className="flex-1 rounded-2xl border border-veil-cyan/25 bg-veil-cyan/[0.05] p-5">
                <p className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-veil-cyan">
                  VEIL Gateway
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {architecture.gatewayModules.map((m) => (
                    <div
                      key={m}
                      className="rounded-xl border border-white/10 bg-ink-soft/70 px-3 py-2.5 text-center text-sm text-slate-300"
                    >
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              <ArrowRight className="h-5 w-5 shrink-0 self-center rotate-90 text-slate-600 lg:rotate-0" />

              {/* Connectors */}
              <div className="flex flex-col items-center gap-2">
                <div className="grid grid-cols-2 gap-2">
                  {architecture.connectors.map((c) => (
                    <div
                      key={c}
                      className="rounded-lg border border-white/10 bg-ink-soft/70 px-3 py-2 text-center text-xs text-slate-300"
                    >
                      {c}
                    </div>
                  ))}
                </div>
                <span className="text-sm font-medium text-white">MCP connectors</span>
              </div>
            </div>

            {/* Tech chips */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 border-t border-white/5 pt-6">
              {architecture.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-veil-cyan/40 hover:text-white"
                >
                  {t}
                </span>
              ))}
            </div>
          </GlassCard>
        </Reveal>

        {/* Principles */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {architecture.principles.map((p, i) => {
            const Icon = principleIcons[i];
            return (
              <Reveal key={p.title} delay={i * 0.1}>
                <GlassCard className="flex h-full items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-veil-green/25 bg-veil-green/10">
                    <Icon className="h-5 w-5 text-veil-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{p.body}</p>
                  </div>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
