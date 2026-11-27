import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, ChevronDown, Shield } from 'lucide-react';
import { hero } from '../content';

/**
 * Animated You → VEIL → Agent diagram.
 * Data packets flow left-to-right, pass through a glowing shield,
 * and exit as masked tokens (e.g. "Rahul K." → "User_7F3A").
 */
function HeroDiagram() {
  const reduce = useReducedMotion();

  // Packets that travel along the wire: original → masked token
  const packets = [
    { original: 'Rahul K.', masked: 'User_7F3A', delay: 0 },
    { original: '4111 1111 1111 1111', masked: '[CARD_1]', delay: 1.2 },
    { original: '+91 98765 43210', masked: '[PHONE_1]', delay: 2.4 },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]">
      {/* SVG paths: You → Shield → Agent */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 440 440" fill="none" aria-hidden>
        {/* top path: You → Shield */}
        <path
          id="hero-path-in"
          d="M 90 220 C 150 220, 170 220, 200 220"
          stroke="url(#hero-grad-in)"
          strokeWidth="2.5"
          strokeDasharray="6 8"
          className={reduce ? undefined : 'animate-dash-flow'}
        />
        {/* bottom path: Shield → Agent */}
        <path
          id="hero-path-out"
          d="M 240 220 C 270 220, 290 220, 350 220"
          stroke="url(#hero-grad-out)"
          strokeWidth="2.5"
          strokeDasharray="6 8"
          className={reduce ? undefined : 'animate-dash-flow'}
        />
        <defs>
          <linearGradient id="hero-grad-in" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F43F5E" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
          <linearGradient id="hero-grad-out" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#34D399" />
          </linearGradient>
        </defs>
      </svg>

      {/* You node (left) */}
      <div className="absolute left-[5%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-ink-soft/80 backdrop-blur-sm">
          <svg width="32" height="38" viewBox="0 0 24 28" fill="none" aria-hidden>
            <circle cx="12" cy="7" r="4.5" stroke="#94A3B8" strokeWidth="2" />
            <path d="M3 26c0-5 4-8 9-8s9 3 9 8" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">You</span>
      </div>

      {/* VEIL shield (center) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <motion.div
          className="relative flex h-20 w-20 items-center justify-center"
          animate={reduce ? undefined : { scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 rounded-2xl bg-veil-cyan/20 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-veil-cyan/40 bg-gradient-to-b from-veil-cyan/15 to-veil-violet/10 backdrop-blur-sm">
            <Shield className="h-7 w-7 text-veil-cyan" />
          </div>
        </motion.div>
        <span className="text-[11px] font-medium uppercase tracking-widest text-veil-cyan">VEIL</span>
      </div>

      {/* Agent orb (right) */}
      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
        <motion.div
          className="relative flex h-16 w-16 items-center justify-center"
          animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-0 rounded-full bg-veil-violet/30 blur-xl" />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-veil-violet to-veil-cyan shadow-[0_0_30px_rgba(139,92,246,0.5)]">
            <Bot className="h-5 w-5 text-white" />
          </div>
        </motion.div>
        <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">Agent</span>
      </div>

      {/* Animated data packets flowing along the wire */}
      {!reduce &&
        packets.map((pkt, i) => (
          <div key={i}>
            {/* Raw packet: You → Shield (left half) */}
            <motion.div
              className="absolute top-1/2"
              initial={{ left: '14%', opacity: 0 }}
              animate={{ left: ['14%', '42%'], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 2,
                delay: pkt.delay,
                repeat: Infinity,
                repeatDelay: 1.6,
                ease: 'easeInOut',
              }}
              style={{ transform: 'translateY(-50%)' }}
            >
              <div className="glass rounded-full px-2.5 py-1 text-[10px] font-mono font-medium text-rose-300 whitespace-nowrap">
                {pkt.original}
              </div>
            </motion.div>

            {/* Masked packet: Shield → Agent (right half) */}
            <motion.div
              className="absolute top-1/2"
              initial={{ left: '52%', opacity: 0 }}
              animate={{ left: ['52%', '78%'], opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 2,
                delay: pkt.delay + 1,
                repeat: Infinity,
                repeatDelay: 1.6,
                ease: 'easeInOut',
              }}
              style={{ transform: 'translateY(-50%)' }}
            >
              <div className="glass rounded-full border border-veil-cyan/30 px-2.5 py-1 text-[10px] font-mono font-medium text-veil-cyan whitespace-nowrap shadow-[0_0_12px_rgba(34,211,238,0.3)]">
                {pkt.masked}
              </div>
            </motion.div>
          </div>
        ))}

      {/* Floating label badges above the wire */}
      <div className="absolute left-[14%] top-[18%]">
        <span className="rounded-full border border-rose-400/20 bg-rose-400/5 px-2 py-0.5 text-[9px] uppercase tracking-widest text-rose-400">
          raw data
        </span>
      </div>
      <div className="absolute right-[14%] top-[18%]">
        <span className="rounded-full border border-veil-green/20 bg-veil-green/5 px-2 py-0.5 text-[9px] uppercase tracking-widest text-veil-green">
          masked
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
      <div className="mx-auto grid max-w-content items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-8">
        <div className="flex flex-col items-start gap-6">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-veil-cyan/25 bg-veil-cyan/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-veil-cyan"
          >
            {hero.eyebrow}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            {hero.titleBefore}{' '}
            <span className="gradient-text">{hero.titleAccent}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-lg text-lg leading-relaxed text-slate-400"
          >
            {hero.subtext}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center gap-4"
          >
            <a
              href={hero.primaryCta.href}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-veil-red/80 to-veil-amber/80 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-veil-red/25 transition-transform duration-200 hover:scale-[1.03]"
            >
              {hero.primaryCta.label}
              <ChevronDown className="h-4 w-4" />
            </a>
            <Link
              to={hero.secondaryCta.href}
              className="inline-flex items-center rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-veil-cyan/50 hover:text-white"
            >
              {hero.secondaryCta.label}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <HeroDiagram />
        </motion.div>
      </div>
    </section>
  );
}
