'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  email: string;
  source?: 'web' | 'email';
  initialRating?: number | null;
}

const LABELS = ['', 'Muy mal', 'Regular', 'Bien', 'Muy bien', 'Excelente'];

export default function FeedbackForm({ email, source = 'web', initialRating }: Props) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [message, setMessage] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!rating) return;
    setEnviando(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          rating,
          message: message.trim() || undefined,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Error al enviar');
        return;
      }

      setExito(true);
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (exito) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-emerald-500/20 p-6 text-center"
        style={{ background: 'rgba(16,185,129,0.04)' }}
      >
        <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={28} />
        <p className="text-white font-bold mb-1">¡Gracias por tu feedback!</p>
        <p className="text-slate-500 text-sm">Tu opinión nos ayuda a mejorar la comunidad.</p>
      </motion.div>
    );
  }

  const activeLevel = hovered || rating;

  return (
    <div
      className="rounded-2xl border border-white/6 p-6"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <h3 className="text-white font-bold text-base mb-1">
        ¿Estás aprendiendo en la comunidad?
      </h3>
      <p className="text-slate-500 text-sm mb-5">Tu opinión nos ayuda a mejorar.</p>

      {/* Star rating */}
      <div className="flex items-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={30}
              fill={activeLevel >= star ? '#FFD700' : 'transparent'}
              stroke={activeLevel >= star ? '#FFD700' : '#334155'}
              strokeWidth={1.5}
            />
          </button>
        ))}
        {activeLevel > 0 && (
          <span className="text-xs text-slate-400 ml-1 font-mono">
            {LABELS[activeLevel]}
          </span>
        )}
      </div>

      {/* Optional message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Cuéntanos más (opcional)..."
        rows={3}
        maxLength={500}
        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all resize-none mb-4"
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

      {error && (
        <p className="text-sm text-red-400 mb-3 text-center">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!rating || enviando}
        className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: rating ? '#00E0FF' : 'rgba(255,255,255,0.06)',
          color: rating ? '#05070D' : '#475569',
          boxShadow: rating ? '0 0 16px rgba(0,224,255,0.2)' : 'none',
        }}
      >
        {enviando ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send size={15} />
            Enviar feedback
          </>
        )}
      </button>
    </div>
  );
}
