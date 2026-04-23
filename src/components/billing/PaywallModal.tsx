'use client';

import { X, Lock, Zap } from 'lucide-react';
import Link from 'next/link';

interface Props {
  onClose: () => void;
}

export default function PaywallModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,7,13,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative max-w-md w-full rounded-2xl border p-8 flex flex-col items-center gap-6 text-center"
        style={{ background: '#0a0e1a', borderColor: '#00E0FF33' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-600 hover:text-slate-400 transition-colors"
        >
          <X size={16} />
        </button>

        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,224,255,0.08)', border: '1px solid rgba(0,224,255,0.2)' }}
        >
          <Lock size={22} style={{ color: '#00E0FF' }} />
        </div>

        <div>
          <h2 className="text-white font-bold text-lg mb-2">Contenido Premium</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Esta lección es exclusiva del plan Pro. Actualiza para acceder a todo el contenido y acelerar tu progreso.
          </p>
        </div>

        <div className="w-full flex flex-col gap-3">
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] transition-all"
          >
            <Zap size={14} />
            Ver planes Pro
          </Link>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            Continuar con Free
          </button>
        </div>
      </div>
    </div>
  );
}
