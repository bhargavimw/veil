import { useEffect, useState } from 'react';

/** Privacy score ring (0-100). */
export function ScoreRing({ score, size = 40 }: { score: number; size?: number }) {
  const [display, setDisplay] = useState(score);
  useEffect(() => {
    const start = display;
    const end = score;
    if (start === end) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 600);
      setDisplay(Math.round(start + (end - start) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? '#34D399' : score >= 60 ? '#F59E0B' : '#F43F5E';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} title={`Privacy score ${score}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - display / 100)}
          style={{ transition: 'stroke 0.4s' }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold tabular-nums text-white">{display}</span>
    </div>
  );
}
