'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import Logo from './Logo';

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Comunidad', href: '#comunidad' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'Eventos', href: '#eventos' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hasEmail, setHasEmail] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  useEffect(() => {
    setHasEmail(!!sessionStorage.getItem('seedup_registro_email'));
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
    >
      <div
        className="max-w-7xl mx-auto flex items-center justify-between rounded-xl px-5 py-3 glass"
        style={{
          boxShadow: scrolled ? '0 4px 30px rgba(0,224,255,0.08)' : 'none',
          borderColor: scrolled ? 'rgba(0,224,255,0.2)' : 'rgba(0,224,255,0.08)',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Logo */}
        <a href="#inicio" className="flex items-center gap-2 group">
          <Logo size={36} />
          <span className="font-bold text-lg tracking-wide text-white group-hover:text-[#00E0FF] transition-colors">
            Seed<span className="text-[#00E0FF]">Up</span> Devs
          </span>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate-400 hover:text-[#00E0FF] transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#00E0FF] group-hover:w-full transition-all duration-300 shadow-[0_0_6px_#00E0FF]" />
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          {hasEmail && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-[#00E0FF] border border-white/10 hover:border-[#00E0FF]/30 transition-all"
            >
              <LayoutDashboard size={14} />
              Mi progreso
            </Link>
          )}
          <a
            href="https://discord.gg/seedupdevs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow px-4 py-2 rounded-lg text-sm font-semibold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] transition-colors"
          >
            Unirse a Discord
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[#00E0FF] p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden glass rounded-xl mt-2 mx-4 px-5 py-4 flex flex-col gap-4"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-slate-300 hover:text-[#00E0FF] transition-colors text-sm"
              >
                {link.label}
              </a>
            ))}
            {hasEmail && (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 text-slate-300 hover:text-[#00E0FF] transition-colors text-sm"
              >
                <LayoutDashboard size={14} />
                Mi progreso
              </Link>
            )}
            <a
              href="https://discord.gg/seedupdevs"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-glow text-center px-4 py-2 rounded-lg text-sm font-semibold text-[#05070D] bg-[#00E0FF]"
            >
              Unirse a Discord
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
