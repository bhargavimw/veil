import type { ReactNode } from 'react';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  /** Renders the 1px violet→cyan gradient border. */
  gradientBorder?: boolean;
};

export function GlassCard({ children, className = '', gradientBorder = false }: GlassCardProps) {
  return (
    <div
      className={`glass rounded-2xl ${gradientBorder ? 'border-gradient' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
