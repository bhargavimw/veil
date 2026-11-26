import { Shield } from 'lucide-react';
import { footer } from '../content';

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 py-12">
      <div className="mx-auto flex max-w-content flex-col items-center gap-8 px-4 sm:px-6 md:flex-row md:justify-between">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br from-veil-violet/30 to-veil-cyan/30">
              <Shield className="h-[18px] w-[18px] text-veil-cyan" />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">VEIL</span>
          </div>
          <p className="max-w-xs text-center text-sm text-slate-500 md:text-left">{footer.tagline}</p>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {footer.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="text-sm text-slate-600">{footer.note}</p>
      </div>
    </footer>
  );
}
