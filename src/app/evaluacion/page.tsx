'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { preguntas } from '@/data/preguntas';
import { useEvaluacion } from '@/hooks/useEvaluacion';
import ProgressBar from '@/components/evaluacion/ProgressBar';
import QuestionCard from '@/components/evaluacion/QuestionCard';
import type { Nivel, Pregunta } from '@/types/evaluacion';

const NIVELES: Nivel[] = ['dev-zero', 'dev-bronce', 'dev-silver', 'dev-gold', 'dev-platinum'];
const POR_NIVEL = 3;

function seleccionarPreguntas(banco: Pregunta[]): Pregunta[] {
  const seleccion: Pregunta[] = [];
  for (const nivel of NIVELES) {
    const porNivel = banco.filter(p => p.nivel === nivel);
    const shuffled = [...porNivel].sort(() => Math.random() - 0.5);
    seleccion.push(...shuffled.slice(0, POR_NIVEL));
  }
  return seleccion;
}

export default function EvaluacionPage() {
  const router = useRouter();
  const [preguntasSeleccionadas] = useState<Pregunta[]>(() => seleccionarPreguntas(preguntas));
  const {
    indiceActual,
    respuestas,
    enviando,
    error,
    esUltima,
    esPrimera,
    progreso,
    respuestaActual,
    setRespuesta,
    siguiente,
    anterior,
    dispatch,
  } = useEvaluacion(preguntasSeleccionadas.length);

  const preguntaActual = preguntasSeleccionadas[indiceActual];
  const seleccionActual = respuestaActual(preguntaActual.id);

  async function handleFinalizar() {
    if (!seleccionActual) return;

    dispatch({ type: 'SET_ENVIANDO', value: true });
    sessionStorage.removeItem('seedup_eval_saved');

    try {
      const res = await fetch('/api/evaluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respuestas,
          preguntaIds: preguntasSeleccionadas.map(p => p.id),
        }),
      });

      if (!res.ok) throw new Error('Error al evaluar');

      const resultado = await res.json();
      sessionStorage.setItem('seedup_resultado', JSON.stringify(resultado));
      router.push('/resultado');
    } catch {
      dispatch({ type: 'SET_ERROR', message: 'Ocurrió un error al enviar. Intenta de nuevo.' });
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col"
      style={{ background: '#05070D' }}
    >
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-white/5 px-4 py-4"
        style={{ background: 'rgba(5,7,13,0.9)', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            <ArrowLeft size={14} />
            Volver
          </Link>
          <ProgressBar
            actual={indiceActual + 1}
            total={preguntasSeleccionadas.length}
            progreso={progreso}
          />
        </div>
      </header>

      {/* ── Contenido ── */}
      <section className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Card */}
          <div
            className="glass-card rounded-2xl p-6 md:p-8"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <QuestionCard
              pregunta={preguntaActual}
              respuestaSeleccionada={seleccionActual}
              onSeleccionar={(r) => setRespuesta(preguntaActual.id, r)}
              indice={indiceActual}
            />
          </div>

          {/* Error */}
          {error && (
            <p className="mt-4 text-center text-sm text-red-400">{error}</p>
          )}

          {/* ── Navegación ── */}
          <div className="flex gap-3 mt-6 justify-between">
            <button
              onClick={anterior}
              disabled={esPrimera}
              className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-slate-400 text-sm font-semibold disabled:opacity-30 hover:border-white/20 hover:text-slate-300 transition-all"
            >
              <ArrowLeft size={16} />
              Anterior
            </button>

            {esUltima ? (
              <button
                onClick={handleFinalizar}
                disabled={!seleccionActual || enviando}
                className="btn-glow flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Send size={16} />
                {enviando ? 'Evaluando...' : 'Ver mi resultado'}
              </button>
            ) : (
              <button
                onClick={siguiente}
                disabled={!seleccionActual}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                style={{ boxShadow: seleccionActual ? '0 0 16px rgba(0,224,255,0.25)' : 'none' }}
              >
                Siguiente
                <ArrowRight size={16} />
              </button>
            )}
          </div>

          {/* Hint validación */}
          {!seleccionActual && (
            <p className="text-center text-xs text-slate-600 mt-4">
              Selecciona una respuesta para continuar
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
