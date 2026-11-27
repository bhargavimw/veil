import { useEffect, useRef, useState } from 'react';
import {
  useInView,
  useReducedMotion,
} from 'framer-motion';
import {
  Activity,
  Ban,
  Bot,
  CheckCircle2,
  Clock,
  Eye,
  KeyRound,
  LayoutDashboard,
  ListTodo,
  ShieldCheck,
  Settings,
  Users,
} from 'lucide-react';
import { productPreview } from '../content';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { GlassCard } from './ui/GlassCard';

const sidebarIcons = [LayoutDashboard, Bot, KeyRound, ListTodo, Activity, Settings];

type Status = 'Allowed' | 'Masked' | 'Approval needed' | 'Blocked';

const statusStyles: Record<Status, string> = {
  Allowed: 'border-veil-green/30 bg-veil-green/10 text-veil-green',
  Masked: 'border-veil-cyan/30 bg-veil-cyan/10 text-veil-cyan',
  'Approval needed': 'border-veil-amber/30 bg-veil-amber/10 text-veil-amber',
  Blocked: 'border-veil-red/30 bg-veil-red/10 text-veil-red',
};

const statusDot: Record<Status, string> = {
  Allowed: 'bg-veil-green',
  Masked: 'bg-veil-cyan',
  'Approval needed': 'bg-veil-amber',
  Blocked: 'bg-veil-red',
};

/** Counts from 0 to `target` the first time it scrolls into view. */
function CountUp({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!inView || reduce) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, target]);

  return (
    <span ref={ref} className="text-3xl font-bold tracking-tight text-white">
      {value.toLocaleString()}
    </span>
  );
}

type ViewName = 'Dashboard' | 'Permissions' | 'Activity';

function DashboardView() {
  const { approvePrompt } = productPreview;
  const [decision, setDecision] = useState<'pending' | 'approved' | 'denied'>('pending');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Live activity
        </h4>
        <ul className="flex flex-col gap-2">
          {productPreview.activity.map((row) => (
            <li
              key={row.agent + row.app}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-ink-soft/60 px-3 py-2.5 text-sm"
            >
              <span className="flex items-center gap-2 text-slate-300">
                <span className={`h-1.5 w-1.5 rounded-full ${statusDot[row.status as Status]}`} />
                <span className="font-medium text-white">{row.agent}</span>
                <span className="text-slate-500">→</span>
                {row.app}
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">{row.action}</span>
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[row.status as Status]}`}
              >
                {row.status}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Interactive approval card */}
      <div className="rounded-xl border border-veil-amber/25 bg-veil-amber/[0.06] p-4">
        {decision === 'pending' ? (
          <>
            <p className="flex items-start gap-2 text-sm text-slate-200">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-veil-amber" />
              {approvePrompt}
            </p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                onClick={() => setDecision('approved')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-veil-green/15 px-4 py-1.5 text-xs font-semibold text-veil-green ring-1 ring-inset ring-veil-green/30 transition-colors hover:bg-veil-green/25"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setDecision('denied')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-veil-red/10 px-4 py-1.5 text-xs font-semibold text-veil-red ring-1 ring-inset ring-veil-red/30 transition-colors hover:bg-veil-red/20"
              >
                <Ban className="h-3.5 w-3.5" /> Deny
              </button>
            </div>
          </>
        ) : (
          <p
            className={`flex items-center gap-2 text-sm font-medium ${
              decision === 'approved' ? 'text-veil-green' : 'text-veil-red'
            }`}
          >
            {decision === 'approved' ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Approved — Shopper-Bot may check out once.
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" /> Denied — Shopper-Bot cannot check out.
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function AgentViewPanel() {
  const { real, masked } = productPreview.agentView;
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        What the agent sees
      </h4>
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-rose-400/15 bg-rose-400/[0.05] p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-rose-400">
            Real
          </p>
          <p className="text-sm text-slate-300">{real}</p>
        </div>
        <div className="rounded-xl border border-veil-green/20 bg-veil-green/[0.05] p-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-veil-green">
            Agent view
          </p>
          <p className="font-mono text-sm text-veil-green/90">{masked}</p>
        </div>
      </div>
    </div>
  );
}

function IdentitiesPanel() {
  const [revoked, setRevoked] = useState<Record<string, boolean>>({});
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Virtual identities
      </h4>
      <ul className="flex flex-col gap-3">
        {productPreview.identities.map((id) => (
          <li
            key={id.value}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 transition-all duration-300 ${
              revoked[id.value]
                ? 'border-white/5 bg-white/[0.02] opacity-50'
                : 'border-white/10 bg-ink-soft/60'
            }`}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {id.label}
              </p>
              <p
                className={`truncate font-mono text-sm ${
                  revoked[id.value] ? 'text-slate-500 line-through' : 'text-slate-200'
                }`}
              >
                {id.value}
              </p>
              <p className="text-xs text-slate-500">{id.created}</p>
            </div>
            <button
              type="button"
              onClick={() => setRevoked((r) => ({ ...r, [id.value]: !r[id.value] }))}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-300 ${
                revoked[id.value]
                  ? 'bg-white/5 text-slate-400 hover:text-slate-200'
                  : 'bg-veil-red/10 text-veil-red ring-1 ring-inset ring-veil-red/30 hover:bg-veil-red/20'
              }`}
            >
              {revoked[id.value] ? 'Restore' : 'Revoke'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PermissionsView() {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Agent permissions
      </h4>
      <ul className="flex flex-col gap-2">
        {[
          { agent: 'Assistant-1', scope: 'Gmail · read inbox', state: 'Allowed (masked)' },
          { agent: 'Shopper-Bot', scope: 'Store · checkout', state: 'Ask each time' },
          { agent: 'Planner', scope: 'Calendar · free/busy', state: 'Allowed' },
        ].map((perm) => (
          <li
            key={perm.agent}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-ink-soft/60 px-3 py-2.5 text-sm"
          >
            <span className="text-slate-300">
              <span className="font-medium text-white">{perm.agent}</span>
              <span className="text-slate-500"> · </span>
              {perm.scope}
            </span>
            <span className="rounded-full border border-veil-cyan/25 bg-veil-cyan/10 px-2.5 py-0.5 text-xs text-veil-cyan">
              {perm.state}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActivityView() {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Audit log
      </h4>
      <ul className="flex flex-col gap-1.5 font-mono text-xs">
        {[
          '10:42:07  Assistant-1  gmail.read        → masked  [CARD_1], [PHONE_1]',
          '10:41:55  Planner      calendar.freeBusy → allowed',
          '10:40:12  Unknown-Agent drive.downloadAll → blocked',
          '10:38:03  Shopper-Bot  store.checkout    → awaiting approval',
        ].map((line) => (
          <li key={line} className="rounded-lg border border-white/5 bg-ink-soft/60 px-3 py-2 text-slate-400">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The full desktop app window mockup. */
function AppWindow() {
  const [view, setView] = useState<ViewName>('Dashboard');

  const viewFor = (name: string): React.ReactNode => {
    switch (name) {
      case 'Dashboard':
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3">
                {productPreview.stats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/5 bg-ink-soft/60 p-4">
                    <CountUp target={s.value} />
                    <p className="mt-1 text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
              <DashboardView />
            </div>
            <div className="flex flex-col gap-6">
              <AgentViewPanel />
              <IdentitiesPanel />
            </div>
          </div>
        );
      case 'Permissions':
        return <PermissionsView />;
      case 'Activity':
        return <ActivityView />;
      default:
        return (
          <p className="flex h-40 items-center justify-center text-sm text-slate-500">
            {name} — mock view
          </p>
        );
    }
  };

  return (
    <GlassCard gradientBorder className="overflow-hidden !backdrop-blur-xl">
      {/* top bar */}
      <div className="flex items-center gap-3 border-b border-white/5 bg-ink-soft/70 px-4 py-3">
        <div className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full bg-rose-400/70" />
          <span className="h-3 w-3 rounded-full bg-amber-400/70" />
          <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink px-3 py-1 text-xs text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-veil-cyan" />
          veil.app — local dashboard
        </div>
      </div>

      <div className="flex">
        {/* sidebar */}
        <aside className="hidden w-48 shrink-0 flex-col gap-1 border-r border-white/5 p-3 sm:flex">
          {productPreview.sidebar.map((item, i) => {
            const Icon = sidebarIcons[i];
            const selectable: ViewName[] = ['Dashboard', 'Permissions', 'Activity'];
            const isSelectable = selectable.includes(item as ViewName);
            return (
              <button
                key={item}
                type="button"
                onClick={() => isSelectable && setView(item as ViewName)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                  view === item
                    ? 'bg-white/10 text-white'
                    : isSelectable
                      ? 'text-slate-400 hover:bg-white/5 hover:text-white'
                      : 'cursor-default text-slate-600'
                }`}
                aria-disabled={!isSelectable}
              >
                <Icon className="h-4 w-4" />
                {item}
              </button>
            );
          })}
        </aside>

        {/* content */}
        <div className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mb-4 flex gap-2 sm:hidden">
            {(['Dashboard', 'Permissions', 'Activity'] as ViewName[]).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setView(name)}
                className={`rounded-full px-3 py-1 text-xs ${
                  view === name ? 'bg-white/10 text-white' : 'text-slate-400'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
          {viewFor(view)}
        </div>
      </div>
    </GlassCard>
  );
}

export function ProductPreview() {
  return (
    <section id="product" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-content px-4 sm:px-6">
        <SectionHeading
          eyebrow={productPreview.eyebrow}
          title={productPreview.title}
          body="A fully interactive mock — click the sidebar, approve a request, revoke an identity."
        />
        <Reveal delay={0.2} className="mt-14">
          <AppWindow />
        </Reveal>
        <Reveal delay={0.3} className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Eye className="h-3.5 w-3.5" />
          All data on this screen is fictional.
        </Reveal>
      </div>
    </section>
  );
}
