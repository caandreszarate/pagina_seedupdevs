'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, ArrowRight, Zap } from 'lucide-react';
import Logo from './Logo';

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  // Posición del spotlight que sigue al mouse
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, visible: false });

  // Posición del cursor personalizado
  const [cursor, setCursor] = useState({ x: -100, y: -100 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Spotlight en % para el gradiente
    setSpotlight({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      visible: true,
    });

    // Cursor personalizado en px absolutas
    setCursor({ x: e.clientX, y: e.clientY });
  };

  const handleMouseLeave = () => {
    setSpotlight((s) => ({ ...s, visible: false }));
    setCursor({ x: -200, y: -200 });
  };

  return (
    <section
      ref={sectionRef}
      id="inicio"
      className="relative min-h-screen flex items-center justify-center px-4 pt-24 pb-16 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'none' }}
    >
      {/* ── Cursor personalizado ── */}
      <div
        className="fixed pointer-events-none z-50 transition-transform duration-75"
        style={{
          left: cursor.x,
          top: cursor.y,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Anillo exterior */}
        <div
          className="w-10 h-10 rounded-full border"
          style={{
            borderColor: 'rgba(0,224,255,0.6)',
            boxShadow: '0 0 12px #00E0FF88, inset 0 0 8px #00E0FF22',
          }}
        />
        {/* Punto central */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00E0FF]"
          style={{ boxShadow: '0 0 8px #00E0FF' }}
        />
      </div>

      {/* ── Spotlight que sigue al mouse ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          opacity: spotlight.visible ? 1 : 0,
          background: `radial-gradient(circle 320px at ${spotlight.x}% ${spotlight.y}%, rgba(0,224,255,0.07) 0%, transparent 70%)`,
        }}
      />

      {/* ── Partículas flotantes fijas de fondo ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { w: 2, h: 2, top: '15%', left: '10%', delay: '0s', dur: '3s' },
          { w: 1, h: 1, top: '25%', left: '80%', delay: '1s', dur: '4s' },
          { w: 2, h: 2, top: '60%', left: '20%', delay: '0.5s', dur: '5s' },
          { w: 1, h: 1, top: '70%', left: '75%', delay: '2s', dur: '3.5s' },
          { w: 2, h: 2, top: '40%', left: '90%', delay: '1.5s', dur: '4.5s' },
          { w: 1, h: 1, top: '80%', left: '45%', delay: '0.8s', dur: '3s' },
          { w: 2, h: 2, top: '10%', left: '55%', delay: '2.5s', dur: '5s' },
          { w: 1, h: 1, top: '50%', left: '5%', delay: '1.2s', dur: '4s' },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#00E0FF] animate-pulse"
            style={{
              width: p.w,
              height: p.h,
              top: p.top,
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.dur,
              boxShadow: '0 0 6px #00E0FF',
              opacity: 0.5,
            }}
          />
        ))}

        {/* Gradientes de fondo estáticos */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,224,255,0.05) 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(30,144,255,0.04) 0%, transparent 70%)' }}
        />
      </div>

      {/* ── Contenido ── */}
      <div className="relative z-10 text-center max-w-4xl mx-auto">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full blur-2xl bg-[#00E0FF] opacity-20 scale-150" />
            <Logo size={120} animated />
          </div>
        </motion.div>

        {/* System tag */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-[#00E0FF] border border-[#00E0FF33] mb-6"
          style={{ background: 'rgba(0,224,255,0.06)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E0FF] animate-pulse" />
          SISTEMA ACTIVO — v2.0.25
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="text-6xl md:text-8xl font-black tracking-tight mb-4"
        >
          <span className="text-white">Seed</span>
          <span className="text-[#00E0FF] glow-text">Up</span>
          <span className="text-white"> Devs</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="text-2xl md:text-3xl font-light tracking-[0.3em] text-slate-400 uppercase mb-3"
        >
          Build. Connect. Scale.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-slate-500 text-base max-w-xl mx-auto mb-10"
        >
          Una comunidad de desarrolladores donde construimos proyectos reales, compartimos conocimiento y escalamos juntos.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a
            href="https://discord.gg/seedupdevs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-glow group flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] text-sm uppercase tracking-wider"
            style={{ cursor: 'none' }}
          >
            <MessageSquare size={18} />
            Unirse a Discord
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </a>

          <a
            href="/evaluacion"
            className="group flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-[#00E0FF] border border-[#00E0FF44] hover:border-[#00E0FF] hover:bg-[#00E0FF0A] transition-all text-sm uppercase tracking-wider"
            style={{ cursor: 'none' }}
          >
            <Zap size={16} />
            Evaluar mi nivel
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>

        {/* Pilares */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="flex justify-center gap-10 mt-16"
        >
          {[
            { value: '📖', label: 'Aprende' },
            { value: '🔨', label: 'Construye' },
            { value: '🌐', label: 'Conecta' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl mb-1">{stat.value}</div>
              <div className="text-sm font-semibold text-[#00E0FF] glow-text uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #05070D)' }}
      />
    </section>
  );
}
