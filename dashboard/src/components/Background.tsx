/**
 * Fixed site-wide backdrop: animated gradient mesh blobs, a faint grid
 * and a subtle noise layer. Purely decorative.
 */
export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* base */}
      <div className="absolute inset-0 bg-ink" />

      {/* grid */}
      <div className="absolute inset-0 bg-grid" />

      {/* gradient mesh blobs */}
      <div className="animate-drift-a absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-veil-violet/20 blur-[120px]" />
      <div className="animate-drift-b absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-veil-cyan/15 blur-[120px]" />
      <div className="animate-drift-a absolute bottom-0 left-1/3 h-[28rem] w-[28rem] rounded-full bg-veil-violet/10 blur-[120px]" style={{ animationDelay: '8s' }} />

      {/* noise */}
      <div className="absolute inset-0 bg-noise" />
    </div>
  );
}
