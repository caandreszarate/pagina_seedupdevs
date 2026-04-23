'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ExternalLink } from 'lucide-react';
import type { Nivel } from '@/types/evaluacion';

const NIVELES: Nivel[] = ['dev-zero', 'dev-bronce', 'dev-silver', 'dev-gold', 'dev-platinum'];

const NIVEL_COLOR: Record<string, string> = {
  'dev-zero':     '#94a3b8',
  'dev-bronce':   '#cd7f32',
  'dev-silver':   '#C0C0C0',
  'dev-gold':     '#FFD700',
  'dev-platinum': '#00E0FF',
};

interface UserDetail {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  current_level: Nivel | null;
  discord_id: string | null;
  discord_username: string | null;
  created_at: string;
  last_contacted_at: string | null;
  activity_score: number;
}

interface PageData {
  user: UserDetail;
  evaluations: Array<{ id: string; nivel: Nivel; score: number; created_at: string }>;
  feedback: Array<{ id: string; rating: number; message: string | null; source: string; created_at: string }>;
  progress_logs: Array<{ id: string; previous_level: Nivel | null; new_level: Nivel; reason: string; created_at: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border border-white/6 p-6"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  const [newLevel, setNewLevel] = useState<Nivel | ''>('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);
  const [overrideSuccess, setOverrideSuccess] = useState(false);

  function loadData(adminEmail: string) {
    setLoading(true);
    fetch(`/api/admin/user/${id}?email=${encodeURIComponent(adminEmail)}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    const email = sessionStorage.getItem('seedup_admin_email') ?? '';
    loadData(email);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleOverride() {
    if (!newLevel) return;
    setOverriding(true);
    try {
      const adminEmail = sessionStorage.getItem('seedup_admin_email') ?? '';
      const res = await fetch('/api/admin/update-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_email: adminEmail,
          user_id: id,
          new_level: newLevel,
          reason: overrideReason.trim() || 'admin_override',
        }),
      });
      if (res.ok) {
        setOverrideSuccess(true);
        setNewLevel('');
        setOverrideReason('');
        loadData(sessionStorage.getItem('seedup_admin_email') ?? '');
        setTimeout(() => setOverrideSuccess(false), 3000);
      }
    } finally {
      setOverriding(false);
    }
  }

  if (loading) return <p className="text-slate-500 text-sm">Cargando...</p>;
  if (!data) return null;

  const { user, evaluations, feedback, progress_logs } = data;
  const levelColor = user.current_level ? NIVEL_COLOR[user.current_level] : '#475569';

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <Link
        href="/admin/users"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        Usuarios
      </Link>

      {/* Profile */}
      <Card title="Perfil">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-white font-bold text-xl">
              {user.nombres} {user.apellidos}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{user.email}</p>
            <p className="text-slate-600 text-xs mt-1">
              Miembro desde {formatDate(user.created_at)}
            </p>
          </div>
          {user.current_level && (
            <span
              className="text-sm font-bold px-3 py-1.5 rounded-lg border shrink-0"
              style={{
                color: levelColor,
                borderColor: levelColor + '33',
                background: levelColor + '10',
              }}
            >
              {user.current_level}
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5 text-sm">
          <div>
            <p className="text-xs text-slate-600 mb-0.5">Teléfono</p>
            <p className="text-slate-300">{user.telefono ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-0.5">Discord</p>
            <p className="text-slate-300">
              {user.discord_username ? (
                <span className="flex items-center gap-1">
                  {user.discord_username}
                  <ExternalLink size={10} className="text-slate-600" />
                </span>
              ) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600 mb-0.5">Último contacto</p>
            <p className="text-slate-300">
              {user.last_contacted_at ? formatDate(user.last_contacted_at) : '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Level override */}
      <Card title="Override de nivel">
        {overrideSuccess && (
          <div className="flex items-center gap-2 text-green-400 text-sm mb-4">
            <CheckCircle2 size={14} />
            Nivel actualizado correctamente
          </div>
        )}
        <div className="flex flex-col gap-3">
          <select
            value={newLevel}
            onChange={e => setNewLevel(e.target.value as Nivel)}
            className="rounded-xl px-4 py-3 text-sm text-white outline-none appearance-none cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <option value="">Seleccionar nuevo nivel...</option>
            {NIVELES.map(n => (
              <option key={n} value={n} disabled={n === user.current_level}>
                {n}{n === user.current_level ? ' (actual)' : ''}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={overrideReason}
            onChange={e => setOverrideReason(e.target.value)}
            placeholder="Razón (opcional)"
            className="rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <button
            onClick={handleOverride}
            disabled={!newLevel || overriding}
            className="px-4 py-3 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] disabled:opacity-40 transition-all"
          >
            {overriding ? 'Aplicando...' : 'Aplicar override'}
          </button>
        </div>
      </Card>

      {/* Evaluations */}
      {evaluations.length > 0 && (
        <Card title="Historial de evaluaciones">
          <div className="flex flex-col gap-2">
            {evaluations.map((ev, i) => (
              <div key={ev.id} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: NIVEL_COLOR[ev.nivel] }}
                  >
                    {ev.nivel}
                  </span>
                  <span className="text-xs text-slate-600">{formatDate(ev.created_at)}</span>
                  {i === 0 && (
                    <span className="text-xs text-slate-600 bg-white/5 px-1.5 py-0.5 rounded-full">
                      última
                    </span>
                  )}
                </div>
                <span className="text-sm font-bold text-white">{ev.score}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Feedback */}
      {feedback.length > 0 && (
        <Card title="Feedback">
          <div className="flex flex-col gap-3">
            {feedback.map(f => (
              <div key={f.id} className="border-b border-white/5 last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm" style={{ color: '#FFD700' }}>
                    {'★'.repeat(f.rating)}
                    <span style={{ color: '#1e293b' }}>{'★'.repeat(5 - f.rating)}</span>
                  </span>
                  <span className="text-xs text-slate-600">{formatDate(f.created_at)}</span>
                  <span className="text-xs text-slate-600 bg-white/5 px-1.5 py-0.5 rounded-full">
                    {f.source}
                  </span>
                </div>
                {f.message && (
                  <p className="text-sm text-slate-400">&ldquo;{f.message}&rdquo;</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Progress logs */}
      {progress_logs.length > 0 && (
        <Card title="Historial de niveles">
          <div className="flex flex-col gap-2">
            {progress_logs.map(pl => (
              <div key={pl.id} className="flex items-center justify-between text-sm py-0.5">
                <div className="flex items-center gap-2">
                  <span style={{ color: pl.previous_level ? NIVEL_COLOR[pl.previous_level] : '#475569' }}>
                    {pl.previous_level ?? 'ninguno'}
                  </span>
                  <span className="text-slate-600">→</span>
                  <span style={{ color: NIVEL_COLOR[pl.new_level] }}>{pl.new_level}</span>
                  {pl.reason === 'admin_override' && (
                    <span className="text-xs text-orange-400 px-1.5 py-0.5 rounded bg-orange-500/10">
                      admin
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-600">{formatDate(pl.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
