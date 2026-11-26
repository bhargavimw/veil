import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bell,
  ChevronRight,
  ClipboardCheck,
  Globe,
  LayoutDashboard,
  Menu,
  Power,
  Shield,
  Bot,
  BadgeCheck,
  X,
} from 'lucide-react';
import { useStore } from './store';
import { ScoreRing } from './components/ScoreRing';
import { DemoControls } from './components/DemoControls';
import { Toasts } from './components/Toasts';
import { Modal } from './components/Modal';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/activity', label: 'Activity', icon: Activity, end: false },
  { to: '/dashboard/agents', label: 'Agents', icon: Bot, end: false },
  { to: '/dashboard/identities', label: 'Identities', icon: BadgeCheck, end: false },
  { to: '/dashboard/approvals', label: 'Approvals', icon: ClipboardCheck, end: false },
];

const TITLES: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/activity': 'Activity',
  '/dashboard/agents': 'Agents',
  '/dashboard/identities': 'Identities',
  '/dashboard/approvals': 'Approvals',
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { approvals } = useStore();
  const pending = approvals.filter((a) => a.status === 'pending').length;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/5 p-5">
        <Link to="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-veil-violet/30 to-veil-cyan/30">
            <Shield className="h-[18px] w-[18px] text-veil-cyan" />
          </span>
          <div>
            <p className="text-base font-bold tracking-tight text-white">VEIL</p>
            <p className="text-[11px] text-slate-500">Personal Privacy Gateway</p>
          </div>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive ? 'bg-white/10 font-medium text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {label === 'Approvals' && pending > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-veil-amber px-1.5 text-[10px] font-bold text-white">
                {pending}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/5 p-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          onClick={onNavigate}
        >
          <Globe className="h-4 w-4" /> Back to website
        </Link>
      </div>
    </div>
  );
}

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [confirmKill, setConfirmKill] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { approvals, agents, killSwitchOn, toggleKillSwitch, mode, decideApproval } = useStore();
  const pending = approvals.filter((a) => a.status === 'pending');
  const title = TITLES[location.pathname] ?? 'Overview';
  const avgScore = agents.length ? Math.round(agents.reduce((s, a) => s + a.privacy_score, 0) / agents.length) : 0;

  useEffect(() => {
    if (!bellOpen) return;
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, [bellOpen]);

  return (
    <div className="min-h-screen bg-ink">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="animate-drift-a absolute -left-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-veil-violet/10 blur-[120px]" />
        <div className="animate-drift-b absolute -right-40 top-1/2 h-[26rem] w-[26rem] rounded-full bg-veil-cyan/10 blur-[120px]" />
        <div className="absolute inset-0 bg-noise" />
      </div>

      {/* kill-switch banner */}
      <AnimatePresence>
        {killSwitchOn && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed inset-x-0 top-0 z-40 overflow-hidden bg-veil-red/90 backdrop-blur-xl"
          >
            <p className="px-4 py-2 text-center text-sm font-semibold text-white">
              All agents paused — kill switch is on. Nothing goes in or out.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex">
        {/* desktop sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/5 bg-[#0D142B]/95 backdrop-blur-xl lg:block ${killSwitchOn ? 'pt-10' : ''}`}>
          <SidebarContent />
        </aside>

        {/* mobile drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 34 }}
                className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-[#0D142B]"
              >
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </motion.aside>
            </div>
          )}
        </AnimatePresence>

        {/* main column */}
        <div className={`flex min-h-screen w-full flex-col lg:pl-64 ${killSwitchOn ? 'pt-10' : ''}`}>
          <header className="sticky top-0 z-30 border-b border-white/5 bg-ink/80 backdrop-blur-xl">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  VEIL <ChevronRight className="h-3 w-3" /> {title}
                </p>
                <h1 className="truncate text-sm font-semibold text-white sm:text-base">{title}</h1>
              </div>

              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                {/* Demo/Live mode badge */}
                <span
                  className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ring-1 sm:inline-flex ${
                    mode === 'live'
                      ? 'bg-veil-green/10 text-veil-green ring-veil-green/30'
                      : 'bg-veil-amber/10 text-veil-amber ring-veil-amber/30'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${mode === 'live' ? 'bg-veil-green' : 'bg-veil-amber'}`} />
                  {mode === 'live' ? 'Live' : 'Demo mode'}
                </span>

                {/* privacy score */}
                <span title="Average privacy score" className="hidden sm:block">
                  <ScoreRing score={avgScore} />
                </span>

                {/* bell + approvals dropdown */}
                <div className="relative" ref={bellRef}>
                  <button
                    type="button"
                    onClick={() => setBellOpen((v) => !v)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:text-white"
                    aria-label={`${pending.length} pending approvals`}
                    aria-expanded={bellOpen}
                  >
                    <Bell className={`h-4 w-4 ${pending.length > 0 ? 'animate-pulse-soft' : ''}`} />
                    {pending.length > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-veil-red px-1 text-[10px] font-bold text-white">
                        {pending.length}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {bellOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-[#0D142B] p-2 shadow-2xl"
                      >
                        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Pending approvals</p>
                        {pending.length === 0 && <p className="px-3 pb-3 text-sm text-slate-500">Nothing waiting.</p>}
                        {pending.slice(0, 4).map((a) => (
                          <div key={a.id} className="rounded-lg px-3 py-2 hover:bg-white/5">
                            <p className="text-sm font-medium text-white">{a.agent} · {a.action}</p>
                            <p className="truncate text-xs text-slate-500">{a.details}</p>
                            <div className="mt-1.5 flex gap-2">
                              <button
                                type="button"
                                onClick={() => { decideApproval(a.id, 'approved'); setBellOpen(false); }}
                                className="rounded-full bg-veil-green/15 px-3 py-1 text-[11px] font-semibold text-veil-green ring-1 ring-veil-green/30 hover:bg-veil-green/25"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => { decideApproval(a.id, 'denied'); setBellOpen(false); }}
                                className="rounded-full bg-veil-red/15 px-3 py-1 text-[11px] font-semibold text-veil-red ring-1 ring-veil-red/30 hover:bg-veil-red/25"
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                        ))}
                        <NavLink
                          to="/dashboard/approvals"
                          onClick={() => setBellOpen(false)}
                          className="mt-1 block rounded-lg px-3 py-2 text-xs font-medium text-veil-cyan hover:bg-white/5"
                        >
                          View all approvals →
                        </NavLink>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* kill switch */}
                <button
                  type="button"
                  onClick={() => setConfirmKill(true)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                    killSwitchOn
                      ? 'bg-veil-red text-white shadow-lg shadow-veil-red/30'
                      : 'border border-veil-red/40 text-veil-red hover:bg-veil-red/10'
                  }`}
                >
                  <Power className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Kill switch</span>
                </button>
              </div>
            </div>
          </header>

          {/* red alert strip when there are blocked events, rendered per-page above content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>

          <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-slate-600">
            VEIL demo — simulated data only, no real accounts are connected.
          </footer>
        </div>
      </div>

      <DemoControls />
      <Toasts />

      <Modal open={confirmKill} onClose={() => setConfirmKill(false)} title={killSwitchOn ? 'Resume all agents?' : 'Enable kill switch?'}>
        <p className="text-sm leading-relaxed text-slate-300">
          {killSwitchOn
            ? 'Agents will resume their normal permissions.'
            : 'Every connected agent will be paused immediately. Nothing will be sent or received until you turn this off.'}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmKill(false)}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { toggleKillSwitch(!killSwitchOn); setConfirmKill(false); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform hover:scale-[1.02] ${
              killSwitchOn ? 'bg-veil-green/80' : 'bg-veil-red'
            }`}
          >
            {killSwitchOn ? 'Resume agents' : 'Pause everything'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
