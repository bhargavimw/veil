import { Check } from 'lucide-react';
import { roadmap } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

export function Roadmap() {
  return (
    <section id="roadmap" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading eyebrow={roadmap.eyebrow} title={roadmap.title} />

        <div className="relative mt-14 lg:mx-16">
          {/* spine */}
          <div className="absolute bottom-4 left-[15px] top-2 w-px bg-gradient-to-b from-veil-violet/60 via-veil-cyan/60 to-veil-green/60 lg:left-1/2" />

          <ol className="flex flex-col gap-10">
            {roadmap.items.map((item, i) => (
              <li key={item.phase} className="relative pl-12 lg:w-1/2 lg:pl-0">
                {i % 2 === 0 ? (
                  /* left-side cards on desktop */
                  <div className="lg:pr-12 lg:text-right">
                    <Reveal delay={0.05}>
                      <div className="glass rounded-2xl p-6">
                        <p className="text-xs font-semibold uppercase tracking-widest text-veil-cyan">
                          {item.phase}
                        </p>
                        <h3 className="mt-1 font-semibold text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
                      </div>
                    </Reveal>
                  </div>
                ) : (
                  /* right-side cards on desktop */
                  <div className="lg:ml-auto lg:pl-12">
                    <Reveal delay={0.05}>
                      <div className="glass rounded-2xl p-6">
                        <p className="text-xs font-semibold uppercase tracking-widest text-veil-violet">
                          {item.phase}
                        </p>
                        <h3 className="mt-1 font-semibold text-white">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
                      </div>
                    </Reveal>
                  </div>
                )}

                {/* node on the spine */}
                <span
                  className={`absolute top-6 flex h-8 w-8 items-center justify-center rounded-full border border-veil-cyan/40 bg-ink left-0 lg:left-auto ${
                    i % 2 === 0 ? 'lg:-right-4' : 'lg:-left-4'
                  }`}
                >
                  <Check className="h-4 w-4 text-veil-green" />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
