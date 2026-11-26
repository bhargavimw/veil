import { CalendarClock, Mail, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useCases } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GlassCard } from './ui/GlassCard';

const icons = [UtensilsCrossed, Mail, CalendarClock, ShoppingBag];

export function UseCases() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={useCases.eyebrow} title={useCases.title} />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.items.map((item, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={item.title} delay={i * 0.08}>
                <GlassCard className="group h-full p-6 transition-transform duration-300 hover:-translate-y-1">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-veil-cyan/20 bg-veil-cyan/10 transition-colors duration-300 group-hover:border-veil-cyan/40 group-hover:bg-veil-cyan/20">
                    <Icon className="h-5 w-5 text-veil-cyan" />
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
