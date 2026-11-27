import { motion, useReducedMotion } from 'framer-motion';
import { CreditCard, IdCard, MapPin, MessageSquare, Phone, User } from 'lucide-react';
import { problem } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GradientText } from './ui/GradientText';

const chipIcons = [User, Phone, IdCard, CreditCard, MapPin, MessageSquare];

/**
 * Sensitive-data chips fly from the person into the AI orb.
 * The orb turns red and pulses "EXPOSED" as chips pour in.
 */
function ExposedDiagram() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="relative flex h-72 items-center justify-between">
        {/* Person node (left) */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-ink-soft/80 backdrop-blur-sm">
            <User className="h-7 w-7 text-slate-300" />
          </div>
          <span className="text-[11px] uppercase tracking-widest text-slate-400">You</span>
        </div>

        {/* Flying chips + connecting lines */}
        <div className="relative mx-4 h-full flex-1">
          {problem.chips.map((chip, i) => {
            const topPct = 6 + i * 15;
            return (
              <div key={chip} className="absolute inset-0">
                {/* Static faint line */}
                <div
                  className="absolute h-px w-full bg-gradient-to-r from-rose-400/20 to-veil-red/30"
                  style={{ top: `${topPct}%` }}
                />
                {/* Animated chip flying left→right */}
                {!reduce && (
                  <motion.div
                    className="absolute"
                    style={{ top: `${topPct}%` }}
                    initial={{ left: '0%', opacity: 0 }}
                    animate={{ left: ['0%', '70%', '100%'], opacity: [0, 1, 1, 0] }}
                    transition={{
                      duration: 2.8,
                      delay: i * 0.35,
                      repeat: Infinity,
                      repeatDelay: 1.5,
                      ease: 'easeIn',
                    }}
                  >
                    <div className="glass flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-rose-400/20 px-2.5 py-1">
                      {(() => {
                        const Icon = chipIcons[i];
                        return <Icon className="h-3 w-3 text-rose-400" />;
                      })()}
                      <span className="text-[10px] whitespace-nowrap text-slate-300">{chip}</span>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
          {/* Static visible chips on mobile / reduced motion */}
          {reduce && (
            <div className="flex h-full flex-col justify-around py-2">
              {problem.chips.map((chip, i) => {
                const Icon = chipIcons[i];
                return (
                  <div key={chip} className="glass flex w-fit items-center gap-1.5 rounded-full border border-rose-400/20 px-2.5 py-1">
                    <Icon className="h-3 w-3 text-rose-400" />
                    <span className="text-[10px] text-slate-300">{chip}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* AI orb (right) — turns red, pulses EXPOSED */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <motion.div
            className="relative flex h-20 w-20 items-center justify-center"
            animate={reduce ? undefined : { scale: [1, 1.12, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Red glow */}
            <div className="absolute inset-0 rounded-full bg-veil-red/30 blur-2xl animate-pulse-soft" />
            {/* Orb body */}
            <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-veil-red to-veil-amber shadow-[0_0_35px_rgba(244,63,94,0.55)]">
              <Bot2 />
            </div>
            {/* EXPOSED label */}
            <motion.span
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-veil-red px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white"
              animate={reduce ? undefined : { opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              Exposed
            </motion.span>
          </motion.div>
          <span className="mt-3 text-[11px] uppercase tracking-widest text-slate-400">AI agent</span>
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="mt-4 text-center text-xs uppercase tracking-widest text-rose-400"
      >
        Everything, by default
      </motion.p>
    </div>
  );
}

/** Small bot icon inline (avoids extra import wiring). */
function Bot2() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="8" width="16" height="12" rx="3" stroke="white" strokeWidth="1.8" />
      <circle cx="9" cy="14" r="1.2" fill="white" />
      <circle cx="15" cy="14" r="1.2" fill="white" />
      <path d="M12 4v4M9 4h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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
          <ExposedDiagram />
        </Reveal>
      </div>
    </section>
  );
}
