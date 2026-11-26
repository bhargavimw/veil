import type { ReactNode } from 'react';

type GradientTextProps = {
  children: ReactNode;
  /** 'danger' uses the red→amber ramp for the problem half of the story. */
  tone?: 'default' | 'danger';
};

export function GradientText({ children, tone = 'default' }: GradientTextProps) {
  return (
    <span className={tone === 'danger' ? 'gradient-text-danger' : 'gradient-text'}>
      {children}
    </span>
  );
}
