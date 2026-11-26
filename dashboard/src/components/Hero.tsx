import { motion, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Calendar, ChevronDown, Cloud, Mail, ShoppingBag, HardDrive } from 'lucide-react';
import { hero } from '../content';

/** Person at a laptop with orbiting app tiles and a glowing AI orb. */
function HeroIllustration() {
  const reduce = useReducedMotion();

  const tiles = [
    { icon: Mail, label: 'Mail', angle: -90 },
    { icon: Calendar, label: 'Calendar', angle: -30 },
    { icon: Cloud, label: 'Cloud', angle: 30 },
    { icon: ShoppingBag, label: 'Shopping', angle: 90 },
    { icon: HardDrive, label: 'Drive', angle: 150 },
  ];
  const R = 128;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[440px]">
      {/* AI orb */}
      <div className="absolute right-[6%] top-1/2 -translate-y-1/2">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-veil-violet/30 blur-2xl animate-pulse-soft" />
          <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-veil-violet to-veil-cyan shadow-[0_0_40px_rgba(139,92,246,0.6)]" />
          <span className="absolute -bottom-7 text-[11px] font-medium uppercase tracking-widest text-slate-400">
            AI agent
          </span>
        </div>
      </div>

      {/* Curved animated path from laptop to orb */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 440 440" fill="none" aria-hidden>
        <path
          id="hero-path"
          d="M 150 250 C 220 250, 240 220, 320 220"
          stroke="url(#hero-grad)"
          strokeWidth="2"
          strokeDasharray="6 8"
          className={reduce ? undefined : 'animate-dash-flow'}
        />
        <defs>
          <linearGradient id="hero-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Orbiting app tiles */}
      {tiles.map(({ icon: Icon, label, angle }, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 150 + R * Math.cos(rad) * 0.62;
        const y = 250 + R * Math.sin(rad) * 0.78;
        return (
          <div
            key={label}
            className="absolute animate-float-y"
            style={{
              left: `${(x / 440) * 100}%`,
              top: `${(y / 440) * 100}%`,
              animationDelay: `${i * 0.7}s`,
            }}
          >
            <div className="glass flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 rounded-xl px-2.5 py-2">
              <Icon className="h-4 w-4 text-veil-cyan" />
              <span className="text-[10px] text-slate-400">{label}</span>
            </div>
          </div>
        );
      })}

      {/* Person at laptop */}
      <div className="absolute left-[8%] top-1/2 -translate-y-1/2">
        <svg width="120" height="150" viewBox="0 0 120 150" fill="none" aria-hidden>
          <circle cx="60" cy="38" r="18" stroke="#94A3B8" strokeWidth="3" />
          <path d="M28 130 v-30 a32 32 0 0 1 64 0 v30" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
          <rect x="18" y="122" width="84" height="12" rx="4" stroke="#22D3EE" strokeWidth="3" />
        </svg>
        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium uppercase tracking-widest text-slate-400">
          You
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
          <HeroIllustration />
        </motion.div>
      </div>
    </section>
  );
}
