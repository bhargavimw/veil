import type { Agent, PermissionValue } from '../types';

const OPTIONS: PermissionValue[] = ['allow', 'mask', 'ask', 'deny'];

const OPTION_STYLES: Record<PermissionValue, string> = {
  allow: 'bg-veil-green/20 text-veil-green ring-veil-green/40',
  mask: 'bg-veil-cyan/20 text-veil-cyan ring-veil-cyan/40',
  ask: 'bg-veil-amber/20 text-veil-amber ring-veil-amber/40',
  deny: 'bg-veil-red/20 text-veil-red ring-veil-red/40',
};

/** Rows = tools, columns = Allow/Mask/Ask/Deny segmented control. */
export function PermissionMatrix({
  agent,
  onChange,
}: {
  agent: Agent;
  onChange: (tool: string, value: PermissionValue) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wider text-slate-500">
            <th className="px-3 py-2 font-medium">Tool</th>
            {OPTIONS.map((o) => (
              <th key={o} className="px-3 py-2 text-center font-medium capitalize">{o}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {Object.keys(agent.permissions).map((tool) => (
            <tr key={tool}>
              <td className="px-3 py-2.5 font-mono text-xs text-slate-300">{tool}</td>
              {OPTIONS.map((opt) => {
                const selected = agent.permissions[tool] === opt;
                return (
                  <td key={opt} className="px-3 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onChange(tool, opt)}
                      aria-label={`${opt} ${tool}`}
                      aria-pressed={selected}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-all duration-150 ${
                        selected
                          ? `ring-2 ${OPTION_STYLES[opt]}`
                          : 'text-slate-600 hover:bg-white/5 hover:text-slate-400'
                      }`}
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${selected ? 'bg-current' : 'bg-slate-700'}`} />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
