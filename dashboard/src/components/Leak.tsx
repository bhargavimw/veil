import { useReducedMotion } from 'framer-motion';
import { EyeOff, Lock, Server, Split } from 'lucide-react';
import { leak } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GlassCard } from './ui/GlassCard';

const cardIcons = [EyeOff, Lock, Split];

/** Red data streams branching from the orb to duplicated dark server nodes. */
function LeakDiagram() {
  const reduce = useReducedMotion();
  const servers = [18, 38, 58, 78];

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <svg viewBox="0 0 640 240" className="h-auto w-full" fill="none" aria-hidden>
        <defs>
          <linearGradient id="leak-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Orb */}
        <circle cx="70" cy="120" r="26" fill="url(#leak-grad)" />
        <circle cx="70" cy="120" r="26" stroke="#F43F5E" strokeOpacity="0.6" />

        {/* Branching streams */}
        {servers.map((y, i) => (
          <path
            key={y}
            d={`M 96 120 C 200 120, 240 ${y + 12}, 470 ${y + 12}`}
            stroke="url(#leak-grad)"
            strokeWidth="1.5"
            strokeDasharray="5 7"
            className={reduce ? undefined : 'animate-dash-flow'}
            style={{ animationDelay: `${i * 0.25}s` }}
          />
        ))}

        {/* Server nodes — dark, duplicated */}
        {servers.map((y, i) => (
          <g key={y} transform={`translate(470 ${y})`}>
            <rect
              width="100"
              height="24"
              rx="6"
              fill="#0E1430"
              stroke="#F43F5E"
              strokeOpacity="0.35"
            />
            <text
              x="50"
              y="16"
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="10"
              fontFamily="inherit"
            >
              copy {i + 1}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-1 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-rose-400">
        <Server className="h-3.5 w-3.5" />
        Every hop keeps a copy
      </div>
    </div>
  );
}

export function Leak() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={leak.eyebrow} tone="danger" title={leak.title} />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {leak.cards.map((card, i) => {
            const Icon = cardIcons[i];
            return (
              <Reveal key={card.title} delay={i * 0.1}>
                <GlassCard className="h-full p-6 transition-colors duration-300 hover:border-rose-400/30">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-rose-400/20 bg-rose-400/10">
                    <Icon className="h-5 w-5 text-rose-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
        <Reveal delay={0.3} className="mt-14">
          <LeakDiagram />
        </Reveal>
      </div>
    </section>
  );
}
