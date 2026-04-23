'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import type { ResultadoEvaluacion, Nivel } from '@/types/evaluacion';
import RegisterForm from '@/components/resultado/RegisterForm';

const NIVEL_CONFIG: Record<Nivel, { label: string; color: string; glow: string; badge: string }> = {
  'dev-zero': {
    label: 'Dev Zero',
    color: '#94a3b8',
    glow: 'rgba(148,163,184,0.2)',
    badge: '◆',
  },
  'dev-bronce': {
    label: 'Dev Bronce',
    color: '#cd7f32',
    glow: 'rgba(205,127,50,0.25)',
    badge: '◆◆',
  },
  'dev-silver': {
    label: 'Dev Silver',
    color: '#C0C0C0',
    glow: 'rgba(192,192,192,0.25)',
    badge: '◆◆◆',
  },
  'dev-gold': {
    label: 'Dev Gold',
    color: '#FFD700',
    glow: 'rgba(255,215,0,0.25)',
    badge: '◆◆◆◆',
  },
  'dev-platinum': {
    label: 'Dev Platinum',
    color: '#00E0FF',
    glow: 'rgba(0,224,255,0.3)',
    badge: '◆◆◆◆◆',
  },
};

export default function ResultadoPage() {
  const router = useRouter();
  const [resultado, setResultado] = useState<ResultadoEvaluacion | null>(null);
  const [discordStatus, setDiscordStatus]     = useState<string | null>(null);
  const [discordUsername, setDiscordUsername] = useState('');
  const [discordError, setDiscordError]       = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('discord');
    if (status) {
      setDiscordStatus(status);
      setDiscordUsername(params.get('username') ?? '');
      setDiscordError(decodeURIComponent(params.get('msg') ?? ''));
    }
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem('seedup_resultado');
    if (!raw) {
      router.replace('/evaluacion');
      return;
    }
    try {
      setResultado(JSON.parse(raw));
    } catch {
      router.replace('/evaluacion');
    }
  }, [router]);

  if (!resultado) return null;

  const cfg = NIVEL_CONFIG[resultado.nivel];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: '#05070D' }}
    >
      {/* Glow de fondo */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle 500px at 50% 40%, ${cfg.glow}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 w-full max-w-lg">

        {/* ── Nivel badge ── */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          <div
            className="inline-flex flex-col items-center gap-3 px-8 py-6 rounded-2xl border"
            style={{
              background: `rgba(${cfg.color === '#00E0FF' ? '0,224,255' : '255,255,255'},0.04)`,
              borderColor: cfg.color + '44',
              boxShadow: `0 0 40px ${cfg.glow}`,
            }}
          >
            <span className="text-3xl tracking-widest" style={{ color: cfg.color }}>
              {cfg.badge}
            </span>
            <span className="text-3xl font-black tracking-tight" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            <span className="text-xs font-mono text-slate-500 uppercase tracking-[0.2em]">
              Tu nivel actual
            </span>
          </div>
        </motion.div>

        {/* ── Score ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-6"
        >
          <p className="text-5xl font-black text-white mb-1">
            {resultado.score}
            <span className="text-2xl text-slate-500">%</span>
          </p>
          <p className="text-slate-500 text-sm">
            {resultado.totalCorrectas} de {resultado.totalPreguntas} respuestas correctas
          </p>
        </motion.div>

        {/* ── Descripción ── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-slate-400 text-sm leading-relaxed mb-8 px-2"
        >
          {resultado.descripcionNivel}
        </motion.p>

        {/* ── Fortalezas y debilidades ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
        >
          {/* Fortalezas */}
          <div
            className="rounded-xl p-5 border border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <h3 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
              <CheckCircle size={12} />
              Fortalezas
            </h3>
            {resultado.fortalezas.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {resultado.fortalezas.map((f) => (
                  <li key={f} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">·</span>
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-600">Sin fortalezas detectadas aún.</p>
            )}
          </div>

          {/* Debilidades */}
          <div
            className="rounded-xl p-5 border border-white/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <h3 className="text-xs font-mono uppercase tracking-widest text-red-400 mb-3 flex items-center gap-2">
              <XCircle size={12} />
              Áreas a mejorar
            </h3>
            {resultado.debilidades.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {resultado.debilidades.map((d) => (
                  <li key={d} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-red-400 mt-0.5">·</span>
                    {d}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-600">Ninguna detectada.</p>
            )}
          </div>
        </motion.div>

        {/* ── Formulario de registro ── */}
        <RegisterForm
          resultado={resultado}
          discordStatus={discordStatus}
          discordUsername={discordUsername}
          discordError={discordError}
        />

        {/* ── Footer links ── */}
        <div className="flex items-center justify-between mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            <ArrowLeft size={12} />
            Volver al inicio
          </Link>
          <Link
            href="/evaluacion"
            onClick={() => sessionStorage.removeItem('seedup_resultado')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            <RotateCcw size={12} />
            Repetir test
          </Link>
        </div>
      </div>
    </main>
  );
}
