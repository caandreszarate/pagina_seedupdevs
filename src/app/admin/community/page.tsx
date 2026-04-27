'use client';

import { useState, useEffect } from 'react';
import {
  Activity, Users, MessageSquare, Zap, TrendingUp, Bell,
  Sun, Target, Trophy, RefreshCw, Search, Loader2, CheckCircle, XCircle,
  UserCheck, Clock, Send, Link2,
} from 'lucide-react';

interface OrchestratorSummary {
  lastRun: string;
  ran: string[];
  skipped: string[];
  failed: string[];
}

interface VisitorRow {
  discord_username: string | null;
  status: string;
  first_seen_at: string;
  verified_at: string | null;
}

interface SchedulerHealth {
  lastRun: string | null;
  minutesSinceLastRun: number | null;
  status: 'healthy' | 'delayed' | 'missing';
  expectedIntervalMinutes: number;
}

interface NudgeSegmentStats {
  sent: number;
  skipped: number;
  failed: number;
}

interface OpportunityConnection {
  id: string;
  source_user_name: string;
  target_user_name: string;
  connection_type: string;
  score: number;
  reasons: string[];
  status: string;
  created_at: string;
}

interface StatsData {
  totalActivityLogs: number;
  totalNudgesSent: number;
  openOpportunities: number;
  activeMentorSessions: number;
  topEngaged: { nombres: string; score: number; tier: string }[];
  recentAutomationEvents: { event_name: string; status: string; created_at: string }[];
  orchestratorSummary: OrchestratorSummary | null;
  visitors: {
    total: number;
    active: number;
    verified: number;
    recent: VisitorRow[];
  };
  schedulerHealth: SchedulerHealth;
  tierDistribution: { passive: number; active: number; builder: number; leader: number };
  nudgeAnalytics: {
    lastRun: string | null;
    last7d: NudgeSegmentStats;
    by_segment: Record<string, NudgeSegmentStats>;
  };
  opportunityMatchingAnalytics: {
    lastRun: string | null;
    lastRunMeta: { created?: number; skipped?: number; failed?: number } | null;
    byStatus: { suggested: number; approved: number; dismissed: number; notified: number };
    byType: Record<string, number>;
    latestConnections: OpportunityConnection[];
  };
}

const EVENT_LABEL: Record<string, string> = {
  daily_seed_sent: 'Daily Seed',
  daily_challenge_sent: 'Reto del día',
  daily_wins_sent: 'Wins del día',
  inactive_nudges_sent: 'Nudges de inactividad',
  weekly_ranking_sent: 'Ranking semanal',
  weekly_scores_reset: 'Reset semanal',
};

const ORCHESTRATOR_JOB_LABEL: Record<string, string> = {
  orchestrator_daily_seed: 'Daily Seed',
  orchestrator_daily_challenge: 'Reto',
  orchestrator_daily_wins: 'Wins',
  orchestrator_inactive_nudges: 'Nudges',
  orchestrator_scan_opportunities: 'Scan oportunidades',
  orchestrator_weekly_ranking: 'Ranking',
  orchestrator_weekly_reset: 'Reset semanal',
};

type ActionKey =
  | 'scan-opportunities'
  | 'daily-seed'
  | 'daily-challenge'
  | 'daily-wins'
  | 'weekly-ranking'
  | 'inactive-nudges'
  | 'weekly-reset';

interface ActionResult {
  ok: boolean;
  message: string;
}

const QUICK_ACTIONS: {
  key: ActionKey;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: 'scan-opportunities', label: 'Escanear oportunidades', icon: Search, color: '#10B981' },
  { key: 'daily-seed', label: 'Publicar Daily Seed', icon: Sun, color: '#F59E0B' },
  { key: 'daily-challenge', label: 'Publicar Reto', icon: Target, color: '#EF4444' },
  { key: 'daily-wins', label: 'Publicar Wins', icon: Trophy, color: '#8B5CF6' },
  { key: 'weekly-ranking', label: 'Generar Ranking', icon: TrendingUp, color: '#00E0FF' },
  { key: 'inactive-nudges', label: 'Ejecutar Nudges', icon: Bell, color: '#F59E0B' },
  { key: 'weekly-reset', label: 'Reset semanal', icon: RefreshCw, color: '#EF4444' },
];

const TIER_STYLE: Record<string, { label: string; className: string }> = {
  passive: { label: 'Pasivo', className: 'bg-slate-700/60 text-slate-400' },
  active: { label: 'Activo', className: 'bg-cyan-900/40 text-cyan-400' },
  builder: { label: 'Builder', className: 'bg-purple-900/40 text-purple-400' },
  leader: { label: 'Leader', className: 'bg-amber-900/40 text-amber-400' },
};

function buildSuccessMessage(action: ActionKey, result: Record<string, unknown>): string {
  switch (action) {
    case 'scan-opportunities':
      return `Escaneados: ${result.scanned} | Creados: ${result.created} | Duplicados omitidos: ${result.skippedDuplicates}`;
    case 'weekly-ranking':
      return `Ranking publicado — ${result.count} usuarios en el top`;
    case 'inactive-nudges':
      return `Nudges enviados: ${result.nudged}`;
    case 'weekly-reset':
      return 'Contadores semanales reiniciados correctamente.';
    default:
      return 'Ejecutado correctamente';
  }
}

function ConfirmModal({
  open,
  title,
  body,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => { if (!loading) onCancel(); }}
      />
      <div className="relative glass-card p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{body}</p>
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white border border-slate-700/60 hover:border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white bg-[#00E0FF]/10 border border-[#00E0FF]/40 hover:bg-[#00E0FF]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityAdminPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminEmail] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return (
      sessionStorage.getItem('seedup_admin_email') ??
      sessionStorage.getItem('seedup_registro_email') ??
      ''
    );
  });
  const [actionLoading, setActionLoading] = useState<Partial<Record<ActionKey, boolean>>>({});
  const [actionResults, setActionResults] = useState<Partial<Record<ActionKey, ActionResult>>>({});
  const [recalcLoading, setRecalcLoading] = useState(false);
  const [recalcResult, setRecalcResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [recalcModalOpen, setRecalcModalOpen] = useState(false);
  const [weeklyResetModalOpen, setWeeklyResetModalOpen] = useState(false);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingResult, setMatchingResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (adminEmail) fetchStats(adminEmail);
  }, [adminEmail]);

  async function fetchStats(email: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/community-stats?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        setError('Error al cargar estadísticas');
        return;
      }
      setStats(await res.json() as StatsData);
    } catch {
      setError('Error de red');
    } finally {
      setLoading(false);
    }
  }

  async function runAction(action: ActionKey) {
    setActionLoading((prev) => ({ ...prev, [action]: true }));
    setActionResults((prev) => ({ ...prev, [action]: undefined }));

    try {
      const res = await fetch('/api/admin/community-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: adminEmail, action }),
      });

      const data = await res.json() as { ok: boolean; result?: Record<string, unknown>; error?: string };

      if (!res.ok || !data.ok) {
        setActionResults((prev) => ({
          ...prev,
          [action]: { ok: false, message: data.error ?? 'Error desconocido' },
        }));
      } else {
        const message = buildSuccessMessage(action, data.result ?? {});
        setActionResults((prev) => ({ ...prev, [action]: { ok: true, message } }));
        if (adminEmail) await fetchStats(adminEmail);
      }
    } catch {
      setActionResults((prev) => ({
        ...prev,
        [action]: { ok: false, message: 'Error de red' },
      }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [action]: false }));
    }
  }

  function runRecalculation() {
    setRecalcModalOpen(true);
  }

  async function confirmRecalculation() {
    setRecalcLoading(true);
    setRecalcResult(null);
    try {
      const res = await fetch('/api/admin/community/recalculate-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: adminEmail }),
      });
      const data = await res.json() as { ok: boolean; updated?: number; windowStart?: string; windowEnd?: string; error?: string };
      if (!res.ok || !data.ok) {
        setRecalcResult({ ok: false, message: data.error ?? 'Error desconocido' });
      } else {
        const from = data.windowStart ? new Date(data.windowStart).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) : '';
        const to = data.windowEnd ? new Date(data.windowEnd).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }) : '';
        setRecalcResult({ ok: true, message: `${data.updated} usuarios actualizados (${from} – ${to})` });
        setRecalcModalOpen(false);
        if (adminEmail) await fetchStats(adminEmail);
      }
    } catch {
      setRecalcResult({ ok: false, message: 'Error de red' });
      setRecalcModalOpen(false);
    } finally {
      setRecalcLoading(false);
    }
  }

  async function confirmWeeklyReset() {
    await runAction('weekly-reset');
    setWeeklyResetModalOpen(false);
  }

  async function runMatching() {
    setMatchingLoading(true);
    setMatchingResult(null);
    try {
      const res = await fetch('/api/admin/community/run-opportunity-matching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail }),
      });
      const data = await res.json() as { ok: boolean; created?: number; skipped?: number; failed?: number; error?: string };
      if (!res.ok || !data.ok) {
        setMatchingResult({ ok: false, message: data.error ?? 'Error desconocido' });
      } else {
        setMatchingResult({
          ok: true,
          message: `Creadas: ${data.created ?? 0} | Omitidas: ${data.skipped ?? 0} | Fallidas: ${data.failed ?? 0}`,
        });
        if (adminEmail) await fetchStats(adminEmail);
      }
    } catch {
      setMatchingResult({ ok: false, message: 'Error de red' });
    } finally {
      setMatchingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-2 border-[#00E0FF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="glass-card p-6 text-red-400">{error}</div>;
  }

  if (!stats) return null;

  const statCards = [
    { label: 'Eventos registrados', value: stats.totalActivityLogs, icon: Activity, color: '#00E0FF' },
    { label: 'Nudges enviados', value: stats.totalNudgesSent, icon: Bell, color: '#F59E0B' },
    { label: 'Oportunidades abiertas', value: stats.openOpportunities, icon: TrendingUp, color: '#10B981' },
    { label: 'Sesiones de mentoría activas', value: stats.activeMentorSessions, icon: Users, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Comunidad — Automatización</h1>
        <p className="text-slate-400 text-sm mt-1">Motor de engagement y actividad en Discord</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={16} style={{ color: card.color }} />
                <span className="text-slate-400 text-xs">{card.label}</span>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Acciones rápidas */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={18} className="text-[#00E0FF]" />
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ key, label, icon: Icon, color }) => {
            const isLoading = actionLoading[key];
            const result = actionResults[key];
            return (
              <div key={key} className="flex flex-col gap-1">
                <button
                  onClick={() => key === 'weekly-reset' ? setWeeklyResetModalOpen(true) : runAction(key)}
                  disabled={!!isLoading}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm text-white text-left"
                >
                  {isLoading ? (
                    <Loader2 size={15} className="animate-spin shrink-0 text-slate-400" />
                  ) : (
                    <Icon size={15} style={{ color }} className="shrink-0" />
                  )}
                  <span>{label}</span>
                </button>
                {result && (
                  <div
                    className={`flex items-start gap-1.5 px-2 py-1 rounded-lg text-xs ${
                      result.ok
                        ? 'bg-green-900/20 text-green-400'
                        : 'bg-red-900/20 text-red-400'
                    }`}
                  >
                    {result.ok ? (
                      <CheckCircle size={12} className="shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={12} className="shrink-0 mt-0.5" />
                    )}
                    <span>{result.message}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap size={18} className="text-[#00E0FF]" />
            Top 5 más activos esta semana
          </h2>
          {stats.topEngaged.length === 0 ? (
            <p className="text-slate-500 text-sm">Sin datos aún</p>
          ) : (
            <ol className="space-y-2">
              {stats.topEngaged.map((u, i) => {
                const tierStyle = TIER_STYLE[u.tier] ?? TIER_STYLE.passive;
                return (
                  <li key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-sm w-5 text-right">{i + 1}.</span>
                      <span className="text-white text-sm">{u.nombres}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${tierStyle.className}`}>
                        {tierStyle.label}
                      </span>
                    </div>
                    <span className="text-[#00E0FF] text-sm font-mono">{u.score} pts</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare size={18} className="text-[#00E0FF]" />
            Últimas automatizaciones
          </h2>
          {stats.recentAutomationEvents.length === 0 ? (
            <p className="text-slate-500 text-sm">Sin eventos aún</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentAutomationEvents.map((ev, i) => (
                <li key={i} className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">
                    {EVENT_LABEL[ev.event_name] ?? ev.event_name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        ev.status === 'ok'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-red-900/40 text-red-400'
                      }`}
                    >
                      {ev.status}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {new Date(ev.created_at).toLocaleDateString('es-CO', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Distribución de engagement */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-[#00E0FF]" />
            Distribución de engagement
          </h2>
          <div className="flex items-center gap-3">
            {recalcResult && (
              <div
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${
                  recalcResult.ok ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                }`}
              >
                {recalcResult.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                <span>{recalcResult.message}</span>
              </div>
            )}
            <button
              onClick={runRecalculation}
              disabled={recalcLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs text-slate-300"
            >
              {recalcLoading ? (
                <Loader2 size={13} className="animate-spin shrink-0" />
              ) : (
                <RefreshCw size={13} className="shrink-0" />
              )}
              Recalcular scoring
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { key: 'passive', label: 'Pasivo', color: 'text-slate-400', bg: 'bg-slate-700/40' },
              { key: 'active', label: 'Activo', color: 'text-cyan-400', bg: 'bg-cyan-900/20' },
              { key: 'builder', label: 'Builder', color: 'text-purple-400', bg: 'bg-purple-900/20' },
              { key: 'leader', label: 'Leader', color: 'text-amber-400', bg: 'bg-amber-900/20' },
            ] as const
          ).map(({ key, label, color, bg }) => (
            <div key={key} className={`rounded-xl ${bg} border border-slate-700/40 p-4 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>
                {stats.tierDistribution[key]}
              </p>
              <p className="text-slate-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Orquestador automático */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity size={18} className="text-[#00E0FF]" />
          Orquestador automático
        </h2>
        {!stats.orchestratorSummary ? (
          <p className="text-slate-500 text-sm">Sin ejecuciones registradas aún</p>
        ) : (
          <div className="space-y-4">
            <p className="text-slate-400 text-sm">
              Último run:{' '}
              <span className="text-white font-mono">
                {new Date(stats.orchestratorSummary.lastRun).toLocaleDateString('es-CO', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-green-400 font-semibold mb-2">Ejecutados</p>
                {stats.orchestratorSummary.ran.length === 0 ? (
                  <p className="text-slate-500 text-xs">Ninguno</p>
                ) : (
                  <ul className="space-y-1">
                    {stats.orchestratorSummary.ran.map((j) => (
                      <li key={j} className="text-xs text-slate-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                        {ORCHESTRATOR_JOB_LABEL[j] ?? j}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold mb-2">Omitidos</p>
                {stats.orchestratorSummary.skipped.length === 0 ? (
                  <p className="text-slate-500 text-xs">Ninguno</p>
                ) : (
                  <ul className="space-y-1">
                    {stats.orchestratorSummary.skipped.map((j) => (
                      <li key={j} className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                        {ORCHESTRATOR_JOB_LABEL[j] ?? j}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-xs text-red-400 font-semibold mb-2">Fallidos</p>
                {stats.orchestratorSummary.failed.length === 0 ? (
                  <p className="text-slate-500 text-xs">Ninguno</p>
                ) : (
                  <ul className="space-y-1">
                    {stats.orchestratorSummary.failed.map((j) => (
                      <li key={j} className="text-xs text-red-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        {ORCHESTRATOR_JOB_LABEL[j] ?? j}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visitantes Discord */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <UserCheck size={18} className="text-[#00E0FF]" />
          Visitantes Discord
        </h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-4 text-center">
            <p className="text-2xl font-bold text-white">{stats.visitors.total}</p>
            <p className="text-slate-400 text-xs mt-1">Total</p>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{stats.visitors.active}</p>
            <p className="text-slate-400 text-xs mt-1">Pendientes</p>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.visitors.verified}</p>
            <p className="text-slate-400 text-xs mt-1">Verificados</p>
          </div>
        </div>
        {stats.visitors.recent.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin visitantes registrados aún</p>
        ) : (
          <div>
            <p className="text-xs text-slate-400 font-semibold mb-3">Últimos 5 ingresos</p>
            <ul className="space-y-2">
              {stats.visitors.recent.map((v, i) => (
                <li key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        v.status === 'verified' ? 'bg-green-400' : 'bg-amber-400'
                      }`}
                    />
                    <span className="text-slate-300 text-sm font-mono">
                      {v.discord_username ?? 'Desconocido'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        v.status === 'verified'
                          ? 'bg-green-900/40 text-green-400'
                          : 'bg-amber-900/40 text-amber-400'
                      }`}
                    >
                      {v.status === 'verified' ? 'verificado' : 'visitante'}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {new Date(v.first_seen_at).toLocaleDateString('es-CO', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Scheduler externo */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock size={18} className="text-[#00E0FF]" />
          Scheduler externo
        </h2>
        <div className="flex items-center gap-3 mb-4">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              stats.schedulerHealth.status === 'healthy'
                ? 'bg-green-900/40 text-green-400'
                : stats.schedulerHealth.status === 'delayed'
                ? 'bg-amber-900/40 text-amber-400'
                : 'bg-slate-700/60 text-slate-400'
            }`}
          >
            {stats.schedulerHealth.status === 'healthy'
              ? 'Saludable'
              : stats.schedulerHealth.status === 'delayed'
              ? 'Retrasado'
              : 'Sin datos'}
          </span>
          <span className="text-slate-400 text-sm">
            Intervalo esperado: {stats.schedulerHealth.expectedIntervalMinutes} min
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-4">
            <p className="text-xs text-slate-400 mb-1">Último run</p>
            <p className="text-white text-sm font-mono">
              {stats.schedulerHealth.lastRun
                ? new Date(stats.schedulerHealth.lastRun).toLocaleDateString('es-CO', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-4">
            <p className="text-xs text-slate-400 mb-1">Minutos desde último run</p>
            <p className="text-white text-sm font-mono">
              {stats.schedulerHealth.minutesSinceLastRun !== null
                ? `${stats.schedulerHealth.minutesSinceLastRun} min`
                : '—'}
            </p>
          </div>
        </div>
        {stats.schedulerHealth.status !== 'healthy' && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-900/20 border border-amber-700/40 px-4 py-3 text-amber-400 text-sm">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>
              {stats.schedulerHealth.status === 'missing'
                ? 'No hay ejecuciones registradas del orchestrator. Verifica que el scheduler externo (cron-job.org) esté configurado y activo.'
                : `El orchestrator no ha corrido en más de ${stats.schedulerHealth.expectedIntervalMinutes + 30} minutos. Revisa el scheduler externo.`}
            </span>
          </div>
        )}
      </div>

      {/* Nudge analytics */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
          <Send size={18} className="text-[#00E0FF]" />
          Nudges de retención
        </h2>
        <p className="text-slate-500 text-xs mb-4">
          {stats.nudgeAnalytics.lastRun
            ? `Último run: ${new Date(stats.nudgeAnalytics.lastRun).toLocaleDateString('es-CO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
            : 'Sin runs registrados aún'}
        </p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {([
            { label: 'Enviados (7d)', value: stats.nudgeAnalytics.last7d.sent, color: 'text-green-400' },
            { label: 'Omitidos (cooldown)', value: stats.nudgeAnalytics.last7d.skipped, color: 'text-slate-400' },
            { label: 'Fallidos', value: stats.nudgeAnalytics.last7d.failed, color: 'text-red-400' },
          ] as const).map(({ label, value, color }) => (
            <div key={label} className="rounded-xl bg-slate-800/40 border border-slate-700/60 p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-semibold mb-3">Desglose por segmento (7d)</p>
          {(
            [
              { key: 'inactive', label: 'Inactivos (14d sin actividad)' },
              { key: 'new-no-action', label: 'Nuevos sin acción (<14d, <5 eventos)' },
              { key: 'team-silent', label: 'Equipo silencioso (7d)' },
              { key: 'active-no-win', label: 'Activos sin logro (14d)' },
            ] as const
          ).map(({ key, label }) => {
            const seg = stats.nudgeAnalytics.by_segment[key] ?? { sent: 0, skipped: 0, failed: 0 };
            return (
              <div key={key} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
                <span className="text-slate-300 text-sm">{label}</span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-green-400">{seg.sent} env</span>
                  <span className="text-slate-500">{seg.skipped} omit</span>
                  {seg.failed > 0 && <span className="text-red-400">{seg.failed} fail</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Cronograma de automatizaciones</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700/50">
                <th className="text-left py-2 pr-4">Ruta</th>
                <th className="text-left py-2 pr-4">Hora (UTC)</th>
                <th className="text-left py-2">Canal Discord</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                { route: '/api/community/orchestrator', time: '13:00 UTC (8am COT) — diario', channel: 'según job' },
                { route: '/api/teams/match', time: '02:00 UTC (9pm COT prev) — diario', channel: '#logros' },
              ].map((row) => (
                <tr key={row.route} className="border-b border-slate-800/50">
                  <td className="py-2 pr-4 font-mono text-xs text-[#00E0FF]">{row.route}</td>
                  <td className="py-2 pr-4">{row.time}</td>
                  <td className="py-2">{row.channel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Matching de oportunidades */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Link2 size={18} className="text-[#00E0FF]" />
            Matching de oportunidades
          </h2>
          <div className="flex items-center gap-3">
            {matchingResult && (
              <div
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg ${
                  matchingResult.ok ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                }`}
              >
                {matchingResult.ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                <span>{matchingResult.message}</span>
              </div>
            )}
            <button
              onClick={runMatching}
              disabled={matchingLoading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-700/60 bg-slate-800/40 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs text-slate-300"
            >
              {matchingLoading ? (
                <Loader2 size={13} className="animate-spin shrink-0" />
              ) : (
                <Link2 size={13} className="shrink-0" />
              )}
              Ejecutar Matching
            </button>
          </div>
        </div>

        {stats.opportunityMatchingAnalytics.lastRun && (
          <p className="text-slate-500 text-xs mb-4">
            Último run:{' '}
            {new Date(stats.opportunityMatchingAnalytics.lastRun).toLocaleDateString('es-CO', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
            {stats.opportunityMatchingAnalytics.lastRunMeta && (
              <span className="ml-2 text-slate-600">
                — {stats.opportunityMatchingAnalytics.lastRunMeta.created ?? 0} creadas,{' '}
                {stats.opportunityMatchingAnalytics.lastRunMeta.skipped ?? 0} omitidas
              </span>
            )}
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {(
            [
              { key: 'suggested', label: 'Sugeridas', color: 'text-cyan-400', bg: 'bg-cyan-900/20' },
              { key: 'approved', label: 'Aprobadas', color: 'text-green-400', bg: 'bg-green-900/20' },
              { key: 'dismissed', label: 'Descartadas', color: 'text-slate-400', bg: 'bg-slate-700/40' },
              { key: 'notified', label: 'Notificadas', color: 'text-purple-400', bg: 'bg-purple-900/20' },
            ] as const
          ).map(({ key, label, color, bg }) => (
            <div key={key} className={`rounded-xl ${bg} border border-slate-700/40 p-4 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>
                {stats.opportunityMatchingAnalytics.byStatus[key]}
              </p>
              <p className="text-slate-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {stats.opportunityMatchingAnalytics.latestConnections.length === 0 ? (
          <p className="text-slate-500 text-sm">Sin conexiones generadas aún. Ejecuta el matching para empezar.</p>
        ) : (
          <div>
            <p className="text-xs text-slate-400 font-semibold mb-3">Últimas conexiones sugeridas</p>
            <div className="space-y-2">
              {stats.opportunityMatchingAnalytics.latestConnections.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl bg-slate-800/30 border border-slate-700/40 px-4 py-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white font-medium">{c.source_user_name}</span>
                      <span className="text-slate-500">→</span>
                      <span className="text-white font-medium">{c.target_user_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          c.connection_type === 'mentor'
                            ? 'bg-amber-900/40 text-amber-400'
                            : c.connection_type === 'collaborator'
                            ? 'bg-cyan-900/40 text-cyan-400'
                            : c.connection_type === 'founder'
                            ? 'bg-purple-900/40 text-purple-400'
                            : 'bg-green-900/40 text-green-400'
                        }`}
                      >
                        {c.connection_type}
                      </span>
                      <span className="text-xs font-mono text-[#00E0FF]">{c.score} pts</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          c.status === 'suggested'
                            ? 'bg-slate-700/60 text-slate-400'
                            : c.status === 'approved'
                            ? 'bg-green-900/40 text-green-400'
                            : 'bg-red-900/40 text-red-400'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </div>
                  {c.reasons.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {c.reasons.slice(0, 3).join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={recalcModalOpen}
        title="Recalcular scoring"
        body="Esto reconstruirá los scores de engagement usando los logs de Discord de los últimos 7 días. Los valores actuales serán sobrescritos."
        confirmLabel="Recalcular"
        loading={recalcLoading}
        onConfirm={confirmRecalculation}
        onCancel={() => setRecalcModalOpen(false)}
      />
      <ConfirmModal
        open={weeklyResetModalOpen}
        title="Reset semanal"
        body="Esto reiniciará los contadores semanales de engagement para todos los usuarios. Esta acción no elimina los logs de Discord, pero los contadores semanales volverán a cero."
        confirmLabel="Ejecutar reset"
        loading={!!actionLoading['weekly-reset']}
        onConfirm={confirmWeeklyReset}
        onCancel={() => setWeeklyResetModalOpen(false)}
      />
    </div>
  );
}
