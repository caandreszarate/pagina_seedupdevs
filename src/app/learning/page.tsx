'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, Clock, BookOpen } from 'lucide-react';
import UpgradeBanner from '@/components/billing/UpgradeBanner';
async function checkIsPro(email: string): Promise<boolean> {
  const res = await fetch(`/api/billing/status?email=${encodeURIComponent(email)}`);
  const d = await res.json();
  return d.subscription?.plan === 'pro' && d.subscription?.status === 'active';
}

const NIVEL_COLOR: Record<string, string> = {
  'dev-zero': '#94a3b8', 'dev-bronce': '#cd7f32', 'dev-silver': '#C0C0C0',
  'dev-gold': '#FFD700', 'dev-platinum': '#00E0FF',
};

interface Lesson { id: string; is_premium: boolean; duration_minutes: number; }
interface Module { id: string; title: string; order_index: number; lessons: Lesson[]; }
interface LearningPath {
  id: string; name: string; description: string; level: string;
  is_premium: boolean; order_index: number; modules: Module[];
}

function totalMinutes(modules: Module[]) {
  return modules.reduce((acc, m) => acc + m.lessons.reduce((a, l) => a + l.duration_minutes, 0), 0);
}

function totalLessons(modules: Module[]) {
  return modules.reduce((acc, m) => acc + m.lessons.length, 0);
}

export default function LearningPage() {
  const [email, setEmail] = useState('');
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [userIsPro, setUserIsPro] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('seedup_registro_email') ?? '';
    setEmail(stored);
    if (stored) checkIsPro(stored).then(setUserIsPro);
    fetch('/api/learning-paths')
      .then(r => r.json())
      .then(d => setPaths(d.paths ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen px-4 py-16" style={{ background: '#05070D' }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-white font-black text-3xl mb-2">Plataforma de Aprendizaje</h1>
          <p className="text-slate-400">Rutas estructuradas para crecer como desarrollador</p>
        </div>

        {!userIsPro && <UpgradeBanner />}

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl border border-white/6 p-6 animate-pulse" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="h-5 bg-white/5 rounded w-1/3 mb-3" />
                <div className="h-3 bg-white/5 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : paths.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p>Aún no hay rutas de aprendizaje disponibles.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {paths.map(path => {
              const locked = path.is_premium && !userIsPro;
              const mins = totalMinutes(path.modules);
              const count = totalLessons(path.modules);
              return (
                <div
                  key={path.id}
                  className="rounded-2xl border border-white/6 p-6 flex flex-col gap-4"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold" style={{ color: NIVEL_COLOR[path.level] ?? '#94a3b8' }}>
                          {path.level}
                        </span>
                        {path.is_premium && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: 'rgba(0,224,255,0.1)', color: '#00E0FF' }}>Pro</span>
                        )}
                      </div>
                      <h2 className="text-white font-bold text-lg">{path.name}</h2>
                      <p className="text-slate-400 text-sm mt-1">{path.description}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><BookOpen size={11} />{count} lecciones</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{mins} min</span>
                      </div>
                    </div>
                    {locked ? (
                      <div className="shrink-0 flex flex-col items-center gap-1">
                        <Lock size={16} className="text-slate-600" />
                        <Link href="/pricing" className="text-xs text-[#00E0FF] hover:underline">Pro</Link>
                      </div>
                    ) : (
                      <Link
                        href={`/learning/${path.id}`}
                        className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] transition-all"
                      >
                        Ver ruta
                      </Link>
                    )}
                  </div>

                  {path.modules.length > 0 && (
                    <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-white/5">
                      {path.modules.slice(0, 4).map(m => (
                        <div key={m.id} className="text-xs text-slate-500 flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
                          {m.title}
                        </div>
                      ))}
                      {path.modules.length > 4 && (
                        <span className="text-xs text-slate-600">+{path.modules.length - 4} módulos más</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
