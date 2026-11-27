import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VeilEvent } from '../types';
import { StatusChip } from './StatusChip';

/** Highlights PII spans in red inside original text. */
function OriginalView({ text }: { text: string }) {
  const parts = useMemo(() => {
    // Highlight numbers and capitalized name pairs
    const re = /(\d[\d ]{6,}\d|\+?\d[\d ]{7,}\d|\b[A-Z][a-z]+\s[A-Z][a-z]+\b|\bOTP\b\s?\d+|\b\d{6}\b)/g;
    const spans: { text: string; hot: boolean }[] = [];
    let last = 0;
    for (const m of text.matchAll(re)) {
      const i = m.index ?? 0;
      if (i > last) spans.push({ text: text.slice(last, i), hot: false });
      spans.push({ text: m[0], hot: true });
      last = i + m[0].length;
    }
    if (last < text.length) spans.push({ text: text.slice(last), hot: false });
    return spans;
  }, [text]);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
      {parts.map((p, i) =>
        p.hot ? (
          <span key={i} className="rounded bg-veil-red/15 px-1 font-semibold text-veil-red">
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </p>
  );
}

/** Highlights [TOKEN_n] placeholders as glowing cyan chips. */
function MaskedView({ text }: { text: string }) {
  const parts = useMemo(() => {
    const re = /(\[[A-Z]+_\d+\])/g;
    const spans: { text: string; hot: boolean }[] = [];
    let last = 0;
    for (const m of text.matchAll(re)) {
      const i = m.index ?? 0;
      if (i > last) spans.push({ text: text.slice(last, i), hot: false });
      spans.push({ text: m[0], hot: true });
      last = i + m[0].length;
    }
    if (last < text.length) spans.push({ text: text.slice(last), hot: false });
    return spans;
  }, [text]);

  return (
    <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
      {parts.map((p, i) =>
        p.hot ? (
          <motion.span
            key={i}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mx-0.5 inline-block rounded-md border border-veil-cyan/40 bg-veil-cyan/10 px-1.5 py-px font-mono text-xs font-semibold text-veil-cyan shadow-[0_0_12px_rgba(34,211,238,0.35)]"
          >
            {p.text}
          </motion.span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </p>
  );
}

/** Split view: what the agent would have seen vs what it actually saw. */
export function SplitView({ event }: { event: VeilEvent }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-veil-red">Real data</p>
        <div className="rounded-xl border border-veil-red/20 bg-veil-red/5 p-4">
          <OriginalView text={event.original_preview} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-veil-cyan">Agent view</p>
        <div className="rounded-xl border border-veil-cyan/20 bg-veil-cyan/5 p-4">
          <MaskedView text={event.masked_preview} />
        </div>
      </div>
    </div>
  );
}

export { StatusChip };
