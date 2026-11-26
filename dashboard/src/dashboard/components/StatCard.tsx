import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

/** StatCard with count-up animation when scrolled into view or when value changes. */
export function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  suffix,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: number;
  tone: 'violet' | 'cyan' | 'green' | 'amber';
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const from = prev.current;
    const to = value;
    prev.current = value;
    if (from === to) { setDisplay(to); return; }
    const start = performance.now();
    const dur = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, inView]);

  const tones = {
    violet: 'text-veil-violet bg-veil-violet/15',
    cyan: 'text-veil-cyan bg-veil-cyan/15',
    green: 'text-veil-green bg-veil-green/15',
    amber: 'text-veil-amber bg-veil-amber/15',
  } as const;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-5"
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </span>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-white">
        {display.toLocaleString()}
        {suffix && <span className="text-base font-medium text-slate-500">{suffix}</span>}
      </p>
    </motion.div>
  );
}
