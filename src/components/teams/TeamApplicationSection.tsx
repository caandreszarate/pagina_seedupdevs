'use client';

import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle2, Loader2 } from 'lucide-react';

interface TeamStatus {
  application: {
    id: string;
    stack: string;
    availability: string;
    level: string;
    status: string;
    created_at: string;
  } | null;
  team: {
    id: string;
    name: string;
    level: string;
    role: string;
    joined_at: string;
  } | null;
}

const NIVEL_LABELS: Record<string, string> = {
  'dev-zero': 'Dev Zero',
  'dev-bronce': 'Dev Bronce',
  'dev-silver': 'Dev Silver',
  'dev-gold': 'Dev Gold',
  'dev-platinum': 'Dev Platinum',
};

export default function TeamApplicationSection({ email }: { email: string }) {
  const [status, setStatus] = useState<TeamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [stack, setStack] = useState('');
  const [availability, setAvailability] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/teams/my-status?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => setStatus(data))
      .catch(() => setStatus({ application: null, team: null }))
      .finally(() => setLoading(false));
  }, [email]);

  async function handleApply(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stack.trim() || !availability.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/teams/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, stack, availability }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al enviar aplicación');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div
      className="rounded-2xl border border-white/6 p-6"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} className="text-slate-500" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">Equipo</h3>
      </div>

      {/* Ya en un equipo */}
      {status?.team && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} style={{ color: '#00E0FF' }} />
            <p className="text-white font-semibold text-sm">{status.team.name}</p>
          </div>
          <p className="text-xs text-slate-500">
            {NIVEL_LABELS[status.team.level] ?? status.team.level} · {status.team.role}
          </p>
        </div>
      )}

      {/* Aplicación pendiente */}
      {!status?.team && status?.application?.status === 'pending' && !submitted && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-amber-400" />
            <p className="text-sm text-amber-300 font-semibold">Aplicación en revisión</p>
          </div>
          <p className="text-xs text-slate-500">
            Stack: {status.application.stack} · Disponibilidad: {status.application.availability}
          </p>
          <p className="text-xs text-slate-600">El admin revisará tu solicitud pronto.</p>
        </div>
      )}

      {/* Éxito tras envío */}
      {submitted && (
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <p className="text-sm text-emerald-400">
            Aplicación enviada. El admin la revisará pronto.
          </p>
        </div>
      )}

      {/* Formulario */}
      {!status?.team && !status?.application && !submitted && (
        <form onSubmit={handleApply} className="flex flex-col gap-4">
          <p className="text-sm text-slate-400 leading-relaxed">
            Aplica para unirte a un equipo y trabajar en proyectos reales con otros devs de tu
            nivel.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500">Stack principal</label>
            <input
              type="text"
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="Ej: React, Node.js, TypeScript"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,224,255,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500">Disponibilidad</label>
            <input
              type="text"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              placeholder="Ej: Fines de semana, 10h/semana"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,224,255,0.4)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={!stack.trim() || !availability.trim() || submitting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            {submitting ? 'Enviando...' : 'Aplicar a equipo'}
          </button>
        </form>
      )}
    </div>
  );
}
