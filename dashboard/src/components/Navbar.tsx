import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import { Menu, Shield, X } from 'lucide-react';
import { nav } from '../content';

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0] ?? '');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const ids = nav.links.map((l) => l.href.slice(1));
  const active = useActiveSection(ids);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const linkCls = (href: string) =>
    `rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
      active === href
        ? 'text-white bg-white/10'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'bg-ink/80 backdrop-blur-xl border-b border-white/5' : 'bg-transparent'
      }`}
    >
      {/* Scroll progress bar */}
      <motion.div
        className="absolute inset-x-0 top-0 h-0.5 origin-left bg-gradient-to-r from-veil-violet via-veil-cyan to-veil-green"
        style={{ scaleX: progress }}
      />
      <nav className="mx-auto flex h-16 max-w-content items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="VEIL home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-veil-violet/30 to-veil-cyan/30 border border-white/10">
            <Shield className="h-[18px] w-[18px] text-veil-cyan" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">VEIL</span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {nav.links.map((link) => (
            <a key={link.href} href={link.href} className={linkCls(link.href)}>
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={nav.cta.href}
            className="hidden rounded-full bg-gradient-to-r from-veil-violet to-veil-cyan px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-veil-cyan/20 transition-transform duration-200 hover:scale-[1.03] sm:inline-flex"
          >
            {nav.cta.label}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-300 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-white/5 bg-ink/95 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-content flex-col gap-1 px-4 py-4">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm ${
                  active === link.href ? 'bg-white/10 text-white' : 'text-slate-300'
                }`}
              >
                {link.label}
              </a>
            ))}
            <Link
              to={nav.cta.href}
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-gradient-to-r from-veil-violet to-veil-cyan px-3 py-2.5 text-center text-sm font-semibold text-white"
            >
              {nav.cta.label}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
