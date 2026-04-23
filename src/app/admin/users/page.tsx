'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Search, AlertTriangle } from 'lucide-react';
import type { Nivel } from '@/types/evaluacion';

const NIVEL_COLOR: Record<string, string> = {
  'dev-zero':     '#94a3b8',
  'dev-bronce':   '#cd7f32',
  'dev-silver':   '#C0C0C0',
  'dev-gold':     '#FFD700',
  'dev-platinum': '#00E0FF',
};

interface UserRow {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  current_level: Nivel | null;
  discord_username: string | null;
  created_at: string;
  evaluation_count: number;
  is_critical: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyCritical, setOnlyCritical] = useState(false);

  const fetchUsers = useCallback((q: string) => {
    const email = sessionStorage.getItem('seedup_admin_email') ?? '';
    setLoading(true);
    fetch(`/api/admin/users?email=${encodeURIComponent(email)}&search=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => setUsers(d.users ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsers(''); }, [fetchUsers]);

  const displayed = onlyCritical ? users.filter(u => u.is_critical) : users;
  const criticalCount = users.filter(u => u.is_critical).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-white font-bold text-xl">Usuarios</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} en total</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setOnlyCritical(v => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              onlyCritical
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : 'border-white/10 text-slate-500 hover:text-slate-300'
            }`}
          >
            <AlertTriangle size={12} />
            Críticos ({criticalCount})
          </button>
          <form
            onSubmit={e => { e.preventDefault(); fetchUsers(search); }}
            className="relative"
          >
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-3 py-1.5 text-sm text-white rounded-lg outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            />
          </form>
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
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3">Nombre</th>
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3 hidden md:table-cell">Email</th>
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3">Nivel</th>
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3 hidden md:table-cell">Evals</th>
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3 hidden lg:table-cell">Registro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.map(u => (
                <tr
                  key={u.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.is_critical && (
                        <AlertTriangle size={11} className="text-orange-400 shrink-0" />
                      )}
                      <span className="text-white font-medium">
                        {u.nombres} {u.apellidos}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.current_level ? (
                      <span
                        className="text-xs font-semibold"
                        style={{ color: NIVEL_COLOR[u.current_level] }}
                      >
                        {u.current_level}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                    {u.evaluation_count}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                    {formatDate(u.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-xs text-[#00E0FF] hover:underline"
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm">
                    No hay usuarios
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
