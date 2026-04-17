'use client';

import { motion } from 'framer-motion';
import { GitBranch as GithubIcon } from 'lucide-react';
import Logo from './Logo';

const DiscordIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 py-12 px-4 mt-10">
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #00E0FF44, transparent)' }}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <div className="font-bold text-white">
                Seed<span className="text-[#00E0FF]">Up</span> Devs
              </div>
              <div className="text-xs text-slate-600">Build. Connect. Scale.</div>
            </div>
          </div>

          {/* Social links */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-4"
          >
            <a
              href="https://discord.gg/seedupdevs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#05070D] bg-[#5865F2] hover:bg-[#4752C4] transition-colors"
              style={{ boxShadow: '0 0 15px #5865F244' }}
            >
              <DiscordIcon />
              Discord
            </a>

            <a
              href="https://github.com/seedupdevs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all"
            >
              <GithubIcon size={16} />
              GitHub
            </a>
          </motion.div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            © 2025 SeedUp Devs. Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-700 font-mono">
            Hecho con{' '}
            <span className="text-[#00E0FF]">⚡</span>
            {' '}por la comunidad
          </p>
        </div>
      </div>
    </footer>
  );
}
