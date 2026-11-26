import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  body?: string;
  align?: 'left' | 'center';
  /** Danger styling tints the eyebrow/gradient toward red for the problem half. */
  tone?: 'default' | 'danger';
};

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'center',
  tone = 'default',
}: SectionHeadingProps) {
  const alignCls = align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start';
  return (
    <div className={`flex max-w-2xl flex-col gap-4 ${alignCls}`}>
      <Reveal>
        <p
          className={`text-xs font-semibold uppercase tracking-[0.25em] ${
            tone === 'danger' ? 'text-rose-400' : 'text-cyan-300'
          }`}
        >
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={0.08}>
        <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h2>
      </Reveal>
      {body ? (
        <Reveal delay={0.16}>
          <p className="text-base leading-relaxed text-slate-400 sm:text-lg">{body}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
