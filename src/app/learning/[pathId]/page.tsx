'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Lock, Clock, CheckCircle2 } from 'lucide-react';
import ProgressBar from '@/components/learning/ProgressBar';

interface Lesson {
  id: string; title: string; is_premium: boolean; duration_minutes: number; order_index: number;
}
interface Module {
  id: string; title: string; description: string; order_index: number; lessons: Lesson[];
}

async function checkIsPro(email: string): Promise<boolean> {
  const res = await fetch(`/api/billing/status?email=${encodeURIComponent(email)}`);
  const d = await res.json();
  return d.subscription?.plan === 'pro' && d.subscription?.status === 'active';
}

async function fetchUserProgress(email: string, lessonIds: string[]): Promise<Record<string, number>> {
  if (!email || lessonIds.length === 0) return {};
  const params = new URLSearchParams({ email });
  lessonIds.forEach(id => params.append('lesson_ids', id));
  const res = await fetch(`/api/progress?${params}`);
  if (!res.ok) return {};
  const d = await res.json();
  return d.progress ?? {};
}

export default function LearningPathPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIsPro, setUserIsPro] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [pathName, setPathName] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('seedup_registro_email') ?? '';
    setEmail(stored);

    fetch(`/api/modules?path_id=${pathId}`)
      .then(r => r.json())
      .then(async d => {
        const mods: Module[] = d.modules ?? [];
        setModules(mods);

        if (stored) {
          const pro = await checkIsPro(stored);
          setUserIsPro(pro);
          const allLessonIds = mods.flatMap(m => m.lessons.map(l => l.id));
          const prog = await fetchUserProgress(stored, allLessonIds);
          setProgress(prog);
        }
      })
      .finally(() => setLoading(false));

    fetch(`/api/learning-paths`)
      .then(r => r.json())
      .then(d => {
        const path = (d.paths ?? []).find((p: { id: string; name: string }) => p.id === pathId);
        if (path) setPathName(path.name);
      });
  }, [pathId]);

  function lessonProgress(lessonId: string) {
    return progress[lessonId] ?? 0;
  }

  function moduleProgress(mod: Module) {
    if (mod.lessons.length === 0) return 0;
    const total = mod.lessons.reduce((acc, l) => acc + lessonProgress(l.id), 0);
    return Math.round(total / mod.lessons.length);
  }

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-16" style={{ background: '#05070D' }}>
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse flex flex-col gap-6">
            <div className="h-6 bg-white/5 rounded w-1/4" />
            <div className="h-8 bg-white/5 rounded w-1/2" />
            <div className="h-48 bg-white/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-16" style={{ background: '#05070D' }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <Link href="/learning" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 mb-3 transition-colors w-fit">
            <ArrowLeft size={14} /> Rutas
          </Link>
          <h1 className="text-white font-black text-3xl">{pathName}</h1>
        </div>

        <div className="flex flex-col gap-6">
          {modules.map((mod, modIdx) => {
            const modPct = moduleProgress(mod);
            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-white/6 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="px-6 py-4 border-b border-white/5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-0.5">Módulo {modIdx + 1}</p>
                      <h2 className="text-white font-bold">{mod.title}</h2>
                      {mod.description && <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>}
                    </div>
                    {email && <span className="text-xs font-bold shrink-0" style={{ color: modPct > 0 ? '#00E0FF' : '#475569' }}>{modPct}%</span>}
                  </div>
                  {email && modPct > 0 && <ProgressBar value={modPct} className="mt-3" />}
                </div>

                <div className="divide-y divide-white/5">
                  {mod.lessons.map(lesson => {
                    const locked = lesson.is_premium && !userIsPro;
                    const pct = lessonProgress(lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center gap-3 px-6 py-3 hover:bg-white/[0.015] transition-colors"
                      >
                        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                          {pct === 100 ? (
                            <CheckCircle2 size={16} className="text-green-400" />
                          ) : locked ? (
                            <Lock size={13} className="text-slate-600" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {locked ? (
                            <span className="text-sm text-slate-600">{lesson.title}</span>
                          ) : (
                            <button
                              onClick={() => router.push(`/lesson/${lesson.id}`)}
                              className="text-sm text-slate-300 hover:text-white transition-colors text-left"
                            >
                              {lesson.title}
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {lesson.is_premium && (
                            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,224,255,0.08)', color: '#00E0FF' }}>Pro</span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Clock size={10} />{lesson.duration_minutes}min
                          </span>
                          {!locked && (
                            <button
                              onClick={() => router.push(`/lesson/${lesson.id}`)}
                              className="text-xs text-[#00E0FF] hover:underline"
                            >
                              {pct > 0 && pct < 100 ? 'Continuar' : pct === 100 ? 'Repasar' : 'Iniciar'} →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
