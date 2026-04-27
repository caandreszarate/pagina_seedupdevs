'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, MessageSquare } from 'lucide-react';

interface Props {
  visible: boolean;
  onAccept: () => void;
}

export default function EvaluationDisclaimerModal({ visible, onAccept }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Focus trap + lock body scroll
  useEffect(() => {
    if (!visible) return;

    const prev = document.activeElement as HTMLElement | null;
    buttonRef.current?.focus();

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        e.preventDefault();
        buttonRef.current?.focus();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      prev?.focus();
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          aria-modal="true"
          role="dialog"
          aria-labelledby="disclaimer-title"
        >
          <motion.div
            className="w-full max-w-md rounded-2xl border border-white/8 flex flex-col overflow-hidden"
            style={{ background: '#0b0f1a' }}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/5"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)' }}
              >
                <AlertTriangle size={16} className="text-yellow-400" />
              </div>
              <h2
                id="disclaimer-title"
                className="text-white font-bold text-base leading-snug"
              >
                Evaluación real de tu nivel
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[60vh]">

              {/* Warning block */}
              <div className="flex flex-col gap-3">
                <p className="text-slate-300 text-sm leading-relaxed">
                  Esta evaluación está diseñada para medir tu nivel real como developer.
                </p>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Te recomendamos <span className="text-white font-semibold">NO usar herramientas de Inteligencia Artificial</span>{' '}
                  (ChatGPT, Copilot, Claude, etc.) mientras respondes.
                </p>

                <div
                  className="rounded-xl p-4 flex flex-col gap-2"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-1">¿Por qué?</p>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    El objetivo no es obtener un resultado perfecto, sino ubicarte correctamente dentro de la comunidad para que puedas aprender, colaborar y crecer.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-sm text-slate-400">Si usas IA:</p>
                  <ul className="flex flex-col gap-1.5">
                    {[
                      'el resultado no reflejará tu nivel real',
                      'podrías terminar en un equipo que no se ajusta a ti',
                      'afectarás la dinámica del equipo',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  Aquí no buscamos perfección.{' '}
                  <span className="text-white font-semibold">Buscamos honestidad y crecimiento real.</span>
                </p>
              </div>

              {/* Discord recommendation block */}
              <div
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: 'rgba(88,101,242,0.06)', border: '1px solid rgba(88,101,242,0.2)' }}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} style={{ color: '#7289DA' }} />
                  <p className="text-xs font-mono uppercase tracking-widest" style={{ color: '#7289DA' }}>
                    Recomendación
                  </p>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Para una mejor experiencia dentro de la comunidad, te recomendamos iniciar sesión con Discord.
                </p>
                <ul className="flex flex-col gap-1.5">
                  {[
                    'asignarte correctamente a un equipo',
                    'sincronizar tu nivel automáticamente',
                    'acceder a todos los beneficios de la comunidad',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="mt-0.5 shrink-0" style={{ color: '#7289DA' }}>◆</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-slate-600">No es obligatorio en este paso.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-4 border-t border-white/5">
              <button
                ref={buttonRef}
                onClick={onAccept}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] transition-all focus:outline-none focus:ring-2 focus:ring-[#00E0FF]/50"
              >
                Entiendo y continuar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
