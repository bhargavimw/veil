import { ArrowRight, Github, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cta } from '../content';
import { Reveal } from './ui/Reveal';
import { GlassCard } from './ui/GlassCard';

export function CTA() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <Reveal>
          <GlassCard gradientBorder className="relative overflow-hidden px-6 py-16 text-center sm:px-12">
            {/* glow accents */}
            <div className="pointer-events-none absolute -top-24 left-1/4 h-56 w-56 rounded-full bg-veil-violet/25 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-1/4 h-56 w-56 rounded-full bg-veil-cyan/20 blur-3xl" />

            <h2 className="relative mx-auto max-w-2xl text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {cta.title}
            </h2>
            <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href={cta.primary.href}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-veil-violet to-veil-cyan px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-veil-violet/25 transition-transform duration-200 hover:scale-[1.03]"
              >
                <Github className="h-4 w-4" />
                {cta.primary.label}
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                to={cta.secondary.href}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-veil-cyan/50 hover:text-white"
              >
                <Play className="h-4 w-4" />
                {cta.secondary.label}
              </Link>
            </div>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
