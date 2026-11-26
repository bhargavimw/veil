import { AlertTriangle, Eye, Landmark, UserX } from 'lucide-react';
import { stakes } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GlassCard } from './ui/GlassCard';

const riskIcons = [UserX, Landmark, Eye, AlertTriangle];

/** Cracked padlock built from simple SVG strokes. */
function CrackedPadlock() {
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-veil-red/15 blur-3xl" />
      <svg width="120" height="130" viewBox="0 0 120 130" fill="none" aria-hidden>
        {/* shackle, broken on the right */}
        <path
          d="M 38 55 V 38 a 22 22 0 0 1 44 0 V 55"
          stroke="#F43F5E"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path d="M 82 44 L 88 52" stroke="#F43F5E" strokeWidth="5" strokeLinecap="round" />
        {/* body with crack */}
        <rect x="24" y="55" width="72" height="56" rx="10" stroke="#94A3B8" strokeWidth="5" />
        <path
          d="M 62 55 L 56 72 L 66 82 L 58 96 L 64 111"
          stroke="#F43F5E"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <circle cx="46" cy="83" r="5" fill="#F43F5E" />
      </svg>
    </div>
  );
}

export function Stakes() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={stakes.eyebrow} tone="danger" title={stakes.title} />
        <Reveal delay={0.15} className="mt-10">
          <CrackedPadlock />
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stakes.risks.map((risk, i) => {
            const Icon = riskIcons[i];
            return (
              <Reveal key={risk.title} delay={i * 0.08}>
                <GlassCard className="h-full p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-rose-400/20 bg-rose-400/10">
                    <Icon className="h-5 w-5 text-rose-400" />
                  </div>
                  <h3 className="font-semibold text-white">{risk.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{risk.body}</p>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={0.25} className="mx-auto mt-14 max-w-2xl">
          <p className="text-center text-lg leading-relaxed text-slate-300">{stakes.closing}</p>
        </Reveal>
      </div>
    </section>
  );
}
