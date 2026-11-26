import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Pause, Play, RotateCcw, ShieldAlert, ShieldX, Sparkles } from 'lucide-react';
import { useStore } from '../store';

/** Floating "Demo controls" panel, toggled with the D key. */
export function DemoControls() {
  const [open, setOpen] = useState(false);
  const { demo } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key.toLowerCase() === 'd') setOpen((o) => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-veil-violet/40 bg-veil-violet/20 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-xl transition-transform hover:scale-[1.03]"
        >
          <Sparkles className="h-4 w-4 text-veil-violet" />
          Demo controls
          <kbd className="rounded border border-white/20 px-1.5 py-0.5 text-[10px] text-slate-300">D</kbd>
        </button>
      )}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            className="fixed bottom-4 right-4 z-50 w-72 rounded-2xl border border-white/10 bg-[#0D142B]/95 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles className="h-4 w-4 text-veil-violet" /> Demo controls
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-500 transition-colors hover:text-white"
                aria-label="Close demo controls"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Press <kbd className="rounded border border-white/15 px-1">D</kbd> anywhere to toggle this panel.
            </p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={demo.play}
                disabled={demo.running}
                className="flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-veil-violet to-veil-cyan px-3 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" /> Play demo script
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={demo.pause}
                  disabled={!demo.running}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:text-white disabled:opacity-40"
                >
                  <Pause className="h-3.5 w-3.5" /> {demo.paused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={demo.reset}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Reset
                </button>
                <button
                  type="button"
                  onClick={demo.triggerApproval}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-veil-amber/30 bg-veil-amber/10 px-3 py-2 text-xs font-medium text-veil-amber transition-colors hover:bg-veil-amber/20"
                >
                  <ShieldAlert className="h-3.5 w-3.5" /> Trigger approval
                </button>
                <button
                  type="button"
                  onClick={demo.triggerBlocked}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-veil-red/30 bg-veil-red/10 px-3 py-2 text-xs font-medium text-veil-red transition-colors hover:bg-veil-red/20"
                >
                  <ShieldX className="h-3.5 w-3.5" /> Trigger blocked
                </button>
              </div>
            </div>
            {demo.running && (
              <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-[11px] text-slate-400">
                Script running — step {demo.step || '…'} of 6. {demo.paused ? '(paused)' : ''}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
