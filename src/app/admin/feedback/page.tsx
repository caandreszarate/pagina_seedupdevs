'use client';

import { useState, useEffect } from 'react';

interface FeedbackRow {
  id: string;
  rating: number;
  message: string | null;
  source: string;
  created_at: string;
  users: { id: string; nombres: string; apellidos: string; email: string } | null;
}

const RATING_COLOR = ['', '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('');

  function fetchFeedback(rating: string) {
    const email = sessionStorage.getItem('seedup_admin_email') ?? '';
    setLoading(true);
    const params = new URLSearchParams({ email });
    if (rating) params.set('rating', rating);
    fetch(`/api/admin/feedback?${params}`)
      .then(r => r.json())
      .then(d => setFeedback(d.feedback ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchFeedback(''); }, []);

  function handleFilter(r: string) {
    setRatingFilter(r);
    fetchFeedback(r);
  }

  const avgRating =
    feedback.length > 0
      ? (feedback.reduce((a, f) => a + f.rating, 0) / feedback.length).toFixed(1)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-bold text-xl">Feedback</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {feedback.length} respuestas
            {avgRating ? (
              <span> · Promedio: <span style={{ color: '#FFD700' }}>{avgRating}★</span></span>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['', '1', '2', '3', '4', '5'].map(r => (
            <button
              key={r}
              onClick={() => handleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${
                ratingFilter === r
                  ? 'text-white border-[#00E0FF]/40 bg-[#00E0FF]/10'
                  : 'border-white/10 text-slate-500 hover:text-slate-300'
              }`}
            >
              {r === '' ? 'Todos' : `${r}★`}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-2xl border border-white/6 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        {loading ? (
          <p className="text-slate-500 text-sm p-6">Cargando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3">Usuario</th>
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3">Rating</th>
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3 hidden md:table-cell">Mensaje</th>
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3 hidden md:table-cell">Fuente</th>
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {feedback.map(f => (
                <tr
                  key={f.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors"
                >
                  <td className="px-4 py-3">
                    {f.users ? (
                      <div>
                        <p className="text-white font-medium">
                          {f.users.nombres} {f.users.apellidos}
                        </p>
                        <p className="text-xs text-slate-500">{f.users.email}</p>
                      </div>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-base" style={{ color: RATING_COLOR[f.rating] }}>
                      {'★'.repeat(f.rating)}
                      <span style={{ color: '#1e293b' }}>{'★'.repeat(5 - f.rating)}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs hidden md:table-cell">
                    {f.message ? (
                      <span className="line-clamp-2">&ldquo;{f.message}&rdquo;</span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-slate-500 px-2 py-0.5 rounded-full bg-white/5">
                      {f.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(f.created_at)}</td>
                </tr>
              ))}
              {feedback.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No hay feedback
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
