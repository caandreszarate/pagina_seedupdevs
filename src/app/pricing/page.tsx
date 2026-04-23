'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap } from 'lucide-react';

const FREE_FEATURES = [
  'Evaluación técnica',
  'Dashboard de progreso',
  'Lecciones básicas (contenido gratuito)',
  'Integración con Discord',
];

const PRO_FEATURES = [
  'Todo lo gratuito',
  'Acceso completo a lecciones premium',
  'Rutas de aprendizaje por nivel',
  'Progreso avanzado y métricas',
  'Recomendaciones personalizadas',
  'Soporte prioritario',
];

export default function PricingPage() {
  const router = useRouter();
  const [email, setEmail] = useState(() =>
    typeof window !== 'undefined'
      ? (sessionStorage.getItem('seedup_registro_email') ?? '')
      : '',
  );
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null);
  const [error, setError] = useState('');

  const resolvedEmail = email || emailInput;

  async function handleCheckout(plan: 'monthly' | 'yearly') {
    if (!resolvedEmail) {
      setError('Ingresa tu email para continuar');
      return;
    }
    setLoading(plan);
    setError('');
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resolvedEmail, plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Error al iniciar pago');
        return;
      }
      router.push(data.url);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20" style={{ background: '#05070D' }}>
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-white mb-3">Planes SeedUp Devs</h1>
          <p className="text-slate-400 text-base">Elige el plan que mejor se adapta a tu crecimiento</p>
        </div>

        {!email && (
          <div className="max-w-md mx-auto mb-10">
            <label className="text-xs font-mono uppercase tracking-widest text-slate-500 block mb-2">
              Tu email para continuar
            </label>
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
          </div>
        )}

        {error && (
          <p className="text-center text-red-400 text-sm mb-6">{error}</p>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free */}
          <div
            className="rounded-2xl border border-white/8 p-8 flex flex-col gap-6"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">Free</p>
              <p className="text-4xl font-black text-white">$0</p>
              <p className="text-slate-500 text-sm mt-1">Para siempre</p>
            </div>
            <ul className="flex flex-col gap-3 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
                  <Check size={14} className="text-slate-500 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              disabled
              className="w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-500 border border-white/8 cursor-default"
            >
              Plan actual
            </button>
          </div>

          {/* Pro */}
          <div
            className="rounded-2xl border p-8 flex flex-col gap-6 relative overflow-hidden"
            style={{ borderColor: '#00E0FF33', background: 'rgba(0,224,255,0.03)' }}
          >
            <div
              className="absolute top-0 right-0 text-xs font-bold px-3 py-1 rounded-bl-xl"
              style={{ background: '#00E0FF', color: '#05070D' }}
            >
              Recomendado
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#00E0FF] mb-2">Pro</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black text-white">$19</p>
                <p className="text-slate-500 text-sm mb-1">/ mes</p>
              </div>
              <p className="text-slate-500 text-sm mt-1">o $149 / año (ahorra 34%)</p>
            </div>
            <ul className="flex flex-col gap-3 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <Check size={14} className="text-[#00E0FF] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleCheckout('monthly')}
                disabled={loading !== null}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={14} />
                {loading === 'monthly' ? 'Redirigiendo...' : 'Pro Mensual — $19/mes'}
              </button>
              <button
                onClick={() => handleCheckout('yearly')}
                disabled={loading !== null}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold text-[#00E0FF] border border-[#00E0FF]/30 hover:bg-[#00E0FF]/5 disabled:opacity-50 transition-all"
              >
                {loading === 'yearly' ? 'Redirigiendo...' : 'Pro Anual — $149/año'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
