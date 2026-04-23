'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Pregunta } from '@/types/evaluacion';

interface QuestionCardProps {
  pregunta: Pregunta;
  respuestaSeleccionada: string | null;
  onSeleccionar: (respuesta: string) => void;
  indice: number;
}

const nivelLabel: Record<string, string> = {
  'dev-zero': 'Dev Zero',
  'dev-bronce': 'Dev Bronce',
  'dev-silver': 'Dev Silver',
  'dev-gold': 'Dev Gold',
  'dev-platinum': 'Dev Platinum',
};

export default function QuestionCard({
  pregunta,
  respuestaSeleccionada,
  onSeleccionar,
  indice,
}: QuestionCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pregunta.id}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <span
            className="text-xs font-mono px-2 py-0.5 rounded border border-[#00E0FF33] text-[#00E0FF]"
            style={{ background: 'rgba(0,224,255,0.06)' }}
          >
            {nivelLabel[pregunta.nivel]}
          </span>
          <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            {pregunta.habilidad.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Pregunta */}
        <p className="text-white text-lg font-semibold mb-5 leading-relaxed">
          {pregunta.pregunta}
        </p>

        {/* Snippet de código */}
        {pregunta.codigo && (
          <div
            className="mb-6 rounded-xl overflow-hidden border border-white/10"
            style={{ background: '#0D1117' }}
          >
            <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <pre className="px-5 py-4 text-sm text-slate-300 font-mono overflow-x-auto leading-relaxed whitespace-pre">
              {pregunta.codigo}
            </pre>
          </div>
        )}

        {/* Opciones */}
        <div className="flex flex-col gap-3">
          {pregunta.opciones.map((opcion, i) => {
            const seleccionada = respuestaSeleccionada === opcion;
            return (
              <button
                key={i}
                onClick={() => onSeleccionar(opcion)}
                className="group w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 font-mono text-sm"
                style={{
                  background: seleccionada ? 'rgba(0,224,255,0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: seleccionada ? '#00E0FF' : 'rgba(255,255,255,0.08)',
                  color: seleccionada ? '#00E0FF' : '#94a3b8',
                  boxShadow: seleccionada ? '0 0 12px rgba(0,224,255,0.12)' : 'none',
                }}
              >
                <span className="flex items-start gap-3">
                  <span
                    className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 transition-all duration-200"
                    style={{
                      borderColor: seleccionada ? '#00E0FF' : 'rgba(255,255,255,0.15)',
                      background: seleccionada ? '#00E0FF' : 'transparent',
                    }}
                  >
                    {seleccionada && (
                      <span className="w-2 h-2 rounded-full bg-[#05070D]" />
                    )}
                  </span>
                  {opcion}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
