import { motion, useReducedMotion } from 'framer-motion';
import { CreditCard, IdCard, MapPin, MessageSquare, Phone, User } from 'lucide-react';
import { problem } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GradientText } from './ui/GradientText';

const chipIcons = [User, Phone, IdCard, CreditCard, MapPin, MessageSquare];

/** Data chips streaming from the person toward the AI orb. */
function StreamingChips() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="relative flex h-64 items-center justify-between">
        {/* person node */}
        <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-ink-soft">
          <User className="h-6 w-6 text-slate-300" />
        </div>

        {/* streams */}
        <div className="relative mx-2 h-full flex-1">
          {chipIcons.map((Icon, i) => {
            const top = 8 + i * 16; // percent
            return (
              <div
                key={i}
                className="absolute left-0 flex w-full items-center gap-2"
                style={{ top: `${top}%` }}
              >
                <div className="glass flex items-center gap-1.5 rounded-full px-2.5 py-1">
                  <Icon className="h-3 w-3 text-rose-400" />
                  <span className="text-[11px] text-slate-300">{problem.chips[i]}</span>
                </div>
                <svg className="h-2 flex-1 overflow-visible" aria-hidden>
                  <line
                    x1="0"
                    y1="4"
                    x2="100%"
                    y2="4"
                    stroke="url(#stream-grad)"
                    strokeWidth="2"
                    strokeDasharray="4 6"
                    className={reduce ? undefined : 'animate-dash-flow'}
                  />
                </svg>
              </div>
            );
          })}
          <svg width="0" height="0" aria-hidden>
            <defs>
              <linearGradient id="stream-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#F43F5E" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* AI orb */}
        <div className="relative z-10 shrink-0">
          <div className="absolute inset-0 rounded-full bg-veil-red/25 blur-xl" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-veil-red to-veil-amber shadow-[0_0_30px_rgba(244,63,94,0.5)]" />
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-2 text-center text-xs uppercase tracking-widest text-rose-400"
      >
        Everything, by default
      </motion.p>
    </div>
  );
}

export function Problem() {
  return (
    <section id="problem" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          eyebrow={problem.eyebrow}
          tone="danger"
          title={
            <>
              {problem.title}
              <GradientText tone="danger">{problem.titleAccent}</GradientText>
            </>
          }
          body={problem.body}
        />
        <Reveal delay={0.2} className="mt-14">
          <StreamingChips />
        </Reveal>
      </div>
    </section>
  );
}
