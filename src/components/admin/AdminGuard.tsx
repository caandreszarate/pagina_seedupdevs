'use client';

import { useState, useEffect } from 'react';
import { Loader2, ShieldX } from 'lucide-react';

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'input' | 'verified' | 'denied'>('loading');
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function verify(email: string) {
    setChecking(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/verify?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        sessionStorage.setItem('seedup_admin_email', email.trim().toLowerCase());
        setStatus('verified');
      } else {
        setStatus('denied');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
      setStatus('input');
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    const stored =
      sessionStorage.getItem('seedup_admin_email') ||
      sessionStorage.getItem('seedup_registro_email');
    if (stored) {
      verify(stored);
    } else {
      setStatus('input');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05070D' }}>
        <Loader2 size={20} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05070D' }}>
        <div className="text-center">
          <ShieldX size={32} className="text-red-500 mx-auto mb-3" />
          <p className="text-white font-bold text-lg">No autorizado</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">
            No tienes acceso al panel de administración.
          </p>
          <button
            onClick={() => setStatus('input')}
            className="text-xs text-slate-600 hover:text-slate-400 underline transition-colors"
          >
            Intentar con otro email
          </button>
        </div>
      </div>
    );
  }

  if (status === 'input') {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ background: '#05070D' }}
      >
        <div
          className="w-full max-w-sm rounded-2xl border border-white/6 p-8"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <p className="text-xs font-mono uppercase tracking-widest text-[#00E0FF] mb-1">Admin</p>
          <h2 className="text-white font-bold text-lg mb-5">Acceso restringido</h2>
          <form
            onSubmit={e => {
              e.preventDefault();
              verify(emailInput);
            }}
            className="flex flex-col gap-3"
          >
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={!emailInput.trim() || checking}
              className="px-4 py-3 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] disabled:opacity-40 transition-all"
            >
              {checking ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
