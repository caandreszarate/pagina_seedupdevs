'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import LessonPlayer from '@/components/learning/LessonPlayer';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [email, setEmail] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('seedup_registro_email') ?? '';
    setEmail(stored);
  }, []);

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: '#05070D' }}>
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link href="/learning" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft size={14} /> Rutas de aprendizaje
          </Link>
          {completed && (
            <Link
              href="/learning"
              className="text-sm text-[#00E0FF] hover:underline"
            >
              Siguiente lección →
            </Link>
          )}
        </div>

        {!email ? (
          <div
            className="rounded-2xl border border-white/8 p-8 text-center"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-slate-400 text-sm mb-4">
              Debes registrarte para acceder al contenido y guardar tu progreso.
            </p>
            <Link
              href="/evaluacion"
              className="inline-block px-4 py-2 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] transition-all"
            >
              Hacer evaluación
            </Link>
          </div>
        ) : (
          <LessonPlayer
            lessonId={id}
            email={email}
            onComplete={() => setCompleted(true)}
          />
        )}
      </div>
    </div>
  );
}
