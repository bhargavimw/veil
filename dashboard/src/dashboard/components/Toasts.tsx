import { AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { ToastItem } from './StatusChip';

/** Bottom-right toast stack. */
export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-[60] flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} text={t.text} tone={t.tone} onClose={() => dismissToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
