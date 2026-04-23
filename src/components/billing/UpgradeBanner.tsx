'use client';

import Link from 'next/link';
import { Zap, X } from 'lucide-react';
import { useState } from 'react';

export default function UpgradeBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="flex items-center justify-between gap-4 px-4 py-3 rounded-xl text-sm"
      style={{ background: 'rgba(0,224,255,0.05)', border: '1px solid rgba(0,224,255,0.15)' }}
    >
      <div className="flex items-center gap-3">
        <Zap size={14} style={{ color: '#00E0FF' }} className="shrink-0" />
        <p className="text-slate-300">
          Estás en el plan Free.{' '}
          <Link href="/pricing" className="text-[#00E0FF] hover:underline font-medium">
            Actualiza a Pro
          </Link>{' '}
          para acceder a todo el contenido.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-600 hover:text-slate-400 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}
