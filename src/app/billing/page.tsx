'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ExternalLink, CreditCard } from 'lucide-react';

interface SubscriptionInfo {
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BillingPage() {
  const [email, setEmail] = useState('');
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'success' | 'cancel' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') setCheckoutStatus('success');
    if (params.get('checkout') === 'cancel') setCheckoutStatus('cancel');

    const storedEmail = sessionStorage.getItem('seedup_registro_email') ?? '';
    setEmail(storedEmail);
    if (storedEmail) fetchSub(storedEmail);
    else setLoading(false);
  }, []);

  async function fetchSub(e: string) {
    setLoading(true);
    const res = await fetch(`/api/billing/status?email=${encodeURIComponent(e)}`);
    const data = await res.json();
    setSub(data.subscription ?? null);
    setLoading(false);
  }

  async function openPortal() {
    setPortalLoading(true);
    const res = await fetch('/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setPortalLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#05070D' }}>
      <div className="max-w-md w-full flex flex-col gap-6">
        <div>
          <h1 className="text-white font-bold text-xl">Facturación</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestiona tu suscripción</p>
        </div>

        {checkoutStatus === 'success' && (
          <div className="flex items-center gap-3 text-green-400 text-sm rounded-xl p-4 bg-green-500/10 border border-green-500/20">
            <CheckCircle2 size={16} />
            ¡Suscripción activada! Ya tienes acceso Pro.
          </div>
        )}
        {checkoutStatus === 'cancel' && (
          <div className="flex items-center gap-3 text-slate-400 text-sm rounded-xl p-4 bg-white/5 border border-white/8">
            <AlertCircle size={16} />
            Pago cancelado. Puedes volver a intentarlo cuando quieras.
          </div>
        )}

        {!email ? (
          <div
            className="rounded-2xl border border-white/8 p-6 text-center"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-slate-400 text-sm mb-4">Inicia sesión en tu dashboard para ver tu facturación</p>
            <Link
              href="/dashboard"
              className="inline-block px-4 py-2 rounded-xl text-sm font-bold text-[#00E0FF] border border-[#00E0FF]/30 hover:bg-[#00E0FF]/5 transition-all"
            >
              Ir al Dashboard
            </Link>
          </div>
        ) : loading ? (
          <p className="text-slate-500 text-sm">Cargando...</p>
        ) : (
          <div
            className="rounded-2xl border border-white/8 p-6 flex flex-col gap-5"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-1">Plan actual</p>
                <p className="text-white font-bold text-lg">
                  {sub?.plan === 'pro' ? 'Pro' : 'Free'}
                </p>
              </div>
              <span
                className="text-xs font-bold px-3 py-1 rounded-full"
                style={
                  sub?.plan === 'pro'
                    ? { background: 'rgba(0,224,255,0.1)', color: '#00E0FF' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }
                }
              >
                {sub?.status === 'active' ? 'Activo' : sub?.status === 'canceled' ? 'Cancelado' : sub?.status ?? 'Free'}
              </span>
            </div>

            {sub?.current_period_end && (
              <p className="text-xs text-slate-500">
                Próxima renovación: {formatDate(sub.current_period_end)}
              </p>
            )}

            <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
              {sub?.plan === 'pro' ? (
                <button
                  onClick={openPortal}
                  disabled={portalLoading}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold text-white border border-white/10 hover:border-white/20 disabled:opacity-50 transition-all"
                >
                  <CreditCard size={14} />
                  {portalLoading ? 'Abriendo portal...' : 'Gestionar suscripción'}
                  <ExternalLink size={12} className="text-slate-500" />
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] transition-all"
                >
                  Actualizar a Pro
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
