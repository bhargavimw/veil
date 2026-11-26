import { Fingerprint, Filter, KeyRound, LineChart, Minimize2 } from 'lucide-react';
import { features } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GlassCard } from './ui/GlassCard';

const icons = [Fingerprint, Filter, KeyRound, LineChart, Minimize2];

export function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={features.eyebrow} title={features.title} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:grid-rows-1">
          {features.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={item.title} delay={i * 0.08} className={i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}>
                <GlassCard className="h-full p-6 transition-transform duration-300 hover:-translate-y-1">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-veil-violet/25 bg-veil-violet/10">
                    <Icon className="h-5 w-5 text-veil-violet" />
                  </div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
                </GlassCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
