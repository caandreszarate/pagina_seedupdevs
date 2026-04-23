'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Star, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

const NIVEL_CONFIG: Record<string, { label: string; color: string }> = {
  'dev-zero':     { label: 'Dev Zero',     color: '#94a3b8' },
  'dev-bronce':   { label: 'Dev Bronce',   color: '#cd7f32' },
  'dev-silver':   { label: 'Dev Silver',   color: '#C0C0C0' },
  'dev-gold':     { label: 'Dev Gold',     color: '#FFD700' },
  'dev-platinum': { label: 'Dev Platinum', color: '#00E0FF' },
  'sin-nivel':    { label: 'Sin nivel',    color: '#475569' },
};

const NIVEL_ORDER = ['dev-zero', 'dev-bronce', 'dev-silver', 'dev-gold', 'dev-platinum', 'sin-nivel'];

interface Stats {
  total_users: number;
  users_by_level: Record<string, number>;
  avg_rating: number | null;
  total_evaluations: number;
  total_upgrades: number;
  critical_users: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = sessionStorage.getItem('seedup_admin_email') ?? '';
    fetch(`/api/admin/stats?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-slate-500 text-sm">Cargando métricas...</p>;
  }

  if (!stats) return null;

  const metrics = [
    { icon: Users,         label: 'Usuarios',      value: stats.total_users,                               color: '#00E0FF' },
    { icon: BarChart3,     label: 'Evaluaciones',   value: stats.total_evaluations,                         color: '#94a3b8' },
    { icon: TrendingUp,    label: 'Upgrades',       value: stats.total_upgrades,                            color: '#4ade80' },
    { icon: Star,          label: 'Rating prom.',   value: stats.avg_rating !== null ? stats.avg_rating.toFixed(1) : '—', color: '#FFD700' },
    { icon: AlertTriangle, label: 'Críticos',       value: stats.critical_users,                            color: '#f97316' },
  ];

  const sortedLevels = Object.entries(stats.users_by_level).sort(
    ([a], [b]) => NIVEL_ORDER.indexOf(a) - NIVEL_ORDER.indexOf(b),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-white font-bold text-xl">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Métricas globales de la comunidad</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {metrics.map(m => (
          <div
            key={m.label}
            className="rounded-xl border border-white/6 p-4"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <m.icon size={13} style={{ color: m.color }} />
              <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
                {m.label}
              </span>
            </div>
            <p className="text-2xl font-black text-white">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Level distribution */}
      <div
        className="rounded-2xl border border-white/6 p-6"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <h2 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
          Distribución por nivel
        </h2>
        <div className="flex flex-col gap-3">
          {sortedLevels.map(([nivel, count]) => {
            const cfg = NIVEL_CONFIG[nivel] ?? { label: nivel, color: '#475569' };
            const pct = stats.total_users > 0 ? (count / stats.total_users) * 100 : 0;
            return (
              <div key={nivel} className="flex items-center gap-4">
                <span className="text-sm font-semibold w-28 shrink-0" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: cfg.color }}
                  />
                </div>
                <span className="text-sm text-white font-bold w-6 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick links */}
      {stats.critical_users > 0 && (
        <div
          className="rounded-xl border border-orange-500/20 p-4 flex items-center justify-between"
          style={{ background: 'rgba(249,115,22,0.04)' }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle size={14} className="text-orange-400" />
            <p className="text-sm text-slate-300">
              <span className="font-bold text-orange-400">{stats.critical_users}</span>{' '}
              usuario{stats.critical_users !== 1 ? 's' : ''} sin progreso detectado{stats.critical_users !== 1 ? 's' : ''}
            </p>
          </div>
          <Link
            href="/admin/users"
            className="text-xs text-orange-400 hover:text-orange-300 underline transition-colors"
          >
            Ver usuarios →
          </Link>
        </div>
      )}
    </div>
  );
}
