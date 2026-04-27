'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Calendar, TrendingUp, BarChart3, Zap, BookOpen, CheckCircle2 } from 'lucide-react';
import type { Nivel } from '@/types/evaluacion';
import FeedbackForm from '@/components/feedback/FeedbackForm';
import RecommendationCard from '@/components/learning/RecommendationCard';
import ProgressBar from '@/components/learning/ProgressBar';
import TeamApplicationSection from '@/components/teams/TeamApplicationSection';
import type { Recommendation } from '@/app/api/recommendations/route';

const NIVEL_CONFIG: Record<Nivel, { label: string; color: string; badge: string }> = {
  'dev-zero':     { label: 'Dev Zero',     color: '#94a3b8', badge: '◆' },
  'dev-bronce':   { label: 'Dev Bronce',   color: '#cd7f32', badge: '◆◆' },
  'dev-silver':   { label: 'Dev Silver',   color: '#C0C0C0', badge: '◆◆◆' },
  'dev-gold':     { label: 'Dev Gold',     color: '#FFD700', badge: '◆◆◆◆' },
  'dev-platinum': { label: 'Dev Platinum', color: '#00E0FF', badge: '◆◆◆◆◆' },
};

interface DashboardData {
  nombres: string;
  apellidos: string;
  current_level: Nivel | null;
  member_since: string;
  evaluations: Array<{ id: string; nivel: Nivel; score: number; created_at: string }>;
  last_feedback: { rating: number; message: string | null; created_at: string } | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= rating ? '#FFD700' : '#1e293b', fontSize: 14 }}>★</span>
      ))}
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [lessonsCompleted, setLessonsCompleted] = useState(0);

  const source = (searchParams.get('source') ?? 'web') as 'web' | 'email';
  const emailParam = searchParams.get('email');

  async function fetchDashboard(targetEmail: string) {
    setLoading(true);
    setNotFound(false);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/dashboard?email=${encodeURIComponent(targetEmail)}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (!res.ok) {
        setErrorMsg('Error al cargar tu perfil. Intenta de nuevo.');
        return;
      }
      const json = await res.json();
      setData(json);
      setEmail(targetEmail);
      sessionStorage.setItem('seedup_registro_email', targetEmail);

      // Cargar datos secundarios en paralelo
      const [subRes, recRes, progRes] = await Promise.all([
        fetch(`/api/billing/status?email=${encodeURIComponent(targetEmail)}`),
        fetch(`/api/recommendations?email=${encodeURIComponent(targetEmail)}`),
        fetch(`/api/progress?email=${encodeURIComponent(targetEmail)}`),
      ]);
      const subData = await subRes.json();
      const recData = await recRes.json();
      const progData = await progRes.json();
      setPlan(subData.subscription?.plan ?? 'free');
      setRecommendations(recData.recommendations ?? []);
      const progMap: Record<string, number> = progData.progress ?? {};
      setLessonsCompleted(Object.values(progMap).filter((p) => p === 100).length);
    } catch {
      setErrorMsg('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const fromParam = emailParam?.trim();
    const fromSession = sessionStorage.getItem('seedup_registro_email')?.trim();
    const resolved = fromParam || fromSession;
    if (resolved) {
      fetchDashboard(resolved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLookup(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    fetchDashboard(trimmed);
  }

  /* ── Sin email todavía: mostrar input ─────────────────────────────────── */
  if (!email && !loading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div
          className="rounded-2xl border border-white/6 p-8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <h2 className="text-white font-bold text-lg mb-1">Ver mi progreso</h2>
          <p className="text-slate-500 text-sm mb-6">
            Ingresa tu correo para ver tu nivel y historial.
          </p>

          <form onSubmit={handleLookup} className="flex flex-col gap-4">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,224,255,0.4)';
                e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0,224,255,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.boxShadow = '';
              }}
            />

            {notFound && (
              <p className="text-sm text-amber-400 text-center">
                No encontramos un perfil con ese email.{' '}
                <Link href="/evaluacion" className="underline">Haz tu evaluación</Link>
              </p>
            )}

            {errorMsg && (
              <p className="text-sm text-red-400 text-center">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={!emailInput.trim()}
              className="btn-glow flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Ver mi progreso
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Cargando ──────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-20">
        <Loader2 size={20} className="animate-spin text-slate-400" />
        <span className="text-slate-400 text-sm">Cargando tu perfil...</span>
      </div>
    );
  }

  if (!data) return null;

  const cfg = data.current_level ? NIVEL_CONFIG[data.current_level] : null;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col gap-5">

      {/* ── Header del perfil ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/6 p-6"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-white font-bold text-lg">{data.nombres} {data.apellidos}</p>
            <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
              <Calendar size={12} />
              Miembro desde {formatDate(data.member_since)}
            </p>
          </div>
          {cfg && (
            <div
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border shrink-0"
              style={{
                borderColor: cfg.color + '44',
                background: `rgba(255,255,255,0.02)`,
              }}
            >
              <span className="text-xs tracking-widest" style={{ color: cfg.color }}>
                {cfg.badge}
              </span>
              <span className="text-xs font-bold whitespace-nowrap" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Estadísticas rápidas ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="grid grid-cols-3 gap-3"
      >
        <div
          className="rounded-xl border border-white/6 p-4"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={14} className="text-slate-500" />
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Evals</span>
          </div>
          <p className="text-3xl font-black text-white">{data.evaluations.length}</p>
        </div>
        <div
          className="rounded-xl border border-white/6 p-4"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-slate-500" />
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Score</span>
          </div>
          <p className="text-3xl font-black text-white">
            {data.evaluations.length > 0
              ? Math.max(...data.evaluations.map((e) => e.score))
              : '—'}
            {data.evaluations.length > 0 && <span className="text-lg text-slate-500">%</span>}
          </p>
        </div>
        <div
          className="rounded-xl border border-white/6 p-4"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={14} className="text-slate-500" />
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500">Clases</span>
          </div>
          <p className="text-3xl font-black text-white">{lessonsCompleted}</p>
        </div>
      </motion.div>

      {/* ── Plan actual ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.11 }}
        className="flex items-center justify-between gap-4 rounded-xl border px-5 py-4"
        style={
          plan === 'pro'
            ? { borderColor: 'rgba(0,224,255,0.2)', background: 'rgba(0,224,255,0.03)' }
            : { borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }
        }
      >
        <div className="flex items-center gap-3">
          <Zap size={15} style={{ color: plan === 'pro' ? '#00E0FF' : '#475569' }} />
          <div>
            <p className="text-white text-sm font-bold">{plan === 'pro' ? 'Plan Pro' : 'Plan Free'}</p>
            <p className="text-xs text-slate-500">
              {plan === 'pro' ? 'Acceso completo a todo el contenido' : 'Contenido gratuito desbloqueado'}
            </p>
          </div>
        </div>
        {plan !== 'pro' ? (
          <Link
            href="/pricing"
            className="text-xs font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] px-3 py-1.5 rounded-lg transition-all shrink-0"
          >
            Actualizar
          </Link>
        ) : (
          <Link href="/billing" className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0">
            Gestionar →
          </Link>
        )}
      </motion.div>

      {/* ── Equipo ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
      >
        <TeamApplicationSection email={email} />
      </motion.div>

      {/* ── Recomendaciones ── */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          className="rounded-2xl border border-white/6 p-6"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500">
              Recomendado para ti
            </h3>
            <Link href="/learning" className="text-xs text-[#00E0FF] hover:underline">Ver todo →</Link>
          </div>
          <div className="flex flex-col gap-2">
            {recommendations.slice(0, 3).map(r => (
              <RecommendationCard key={r.lesson_id} recommendation={r} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Historial de evaluaciones ── */}
      {data.evaluations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="rounded-2xl border border-white/6 p-6"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-4">
            Historial de evaluaciones
          </h3>
          <div className="flex flex-col gap-3">
            {data.evaluations.map((ev, i) => {
              const evCfg = NIVEL_CONFIG[ev.nivel];
              return (
                <div key={ev.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-mono"
                      style={{ color: evCfg.color }}
                    >
                      {evCfg.badge}
                    </span>
                    <div>
                      <p className="text-sm text-white font-semibold" style={{ color: evCfg.color }}>
                        {evCfg.label}
                      </p>
                      <p className="text-xs text-slate-600">{formatDate(ev.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg font-black text-white">{ev.score}</span>
                    <span className="text-xs text-slate-500">%</span>
                    {i === 0 && (
                      <span className="text-xs bg-white/5 text-slate-500 px-2 py-0.5 rounded-full ml-1">
                        última
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Último feedback (si existe) ── */}
      {data.last_feedback && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/6 p-6"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
            Tu último feedback
          </h3>
          <StarDisplay rating={data.last_feedback.rating} />
          {data.last_feedback.message && (
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              &ldquo;{data.last_feedback.message}&rdquo;
            </p>
          )}
          <p className="text-xs text-slate-600 mt-2">{formatDate(data.last_feedback.created_at)}</p>
        </motion.div>
      )}

      {/* ── Formulario de feedback ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26 }}
      >
        <FeedbackForm
          email={email}
          source={source}
          initialRating={data.last_feedback?.rating ?? null}
        />
      </motion.div>

      {/* ── Re-evaluar ── */}
      <div className="text-center pb-4">
        <Link
          href="/evaluacion"
          className="text-xs text-slate-600 hover:text-slate-400 transition-colors underline"
        >
          Hacer una nueva evaluación
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: '#05070D' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 border-b border-white/5 px-4 py-4"
        style={{ background: 'rgba(5,7,13,0.9)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            <ArrowLeft size={14} />
            Inicio
          </Link>
          <span className="text-xs font-mono uppercase tracking-widest text-slate-600">
            Mi progreso
          </span>
        </div>
      </header>

      <section className="flex-1 flex items-start justify-center px-4 py-12">
        <Suspense
          fallback={
            <div className="flex items-center gap-3 py-20">
              <Loader2 size={20} className="animate-spin text-slate-400" />
              <span className="text-slate-400 text-sm">Cargando...</span>
            </div>
          }
        >
          <DashboardContent />
        </Suspense>
      </section>
    </main>
  );
}
