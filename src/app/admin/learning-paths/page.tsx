'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, Database } from 'lucide-react';
import Link from 'next/link';

const NIVELES = ['dev-zero', 'dev-bronce', 'dev-silver', 'dev-gold', 'dev-platinum'];
const NIVEL_COLOR: Record<string, string> = {
  'dev-zero': '#94a3b8', 'dev-bronce': '#cd7f32', 'dev-silver': '#C0C0C0',
  'dev-gold': '#FFD700', 'dev-platinum': '#00E0FF',
};

interface LearningPath {
  id: string; name: string; description: string; level: string;
  is_premium: boolean; order_index: number; modules: { count: number }[];
}

interface FormState {
  name: string; description: string; level: string;
  is_premium: boolean; order_index: number;
}

const EMPTY_FORM: FormState = { name: '', description: '', level: 'dev-zero', is_premium: false, order_index: 0 };

function getAdminEmail() {
  return typeof window !== 'undefined'
    ? (sessionStorage.getItem('seedup_admin_email') ?? '')
    : '';
}

export default function AdminLearningPathsPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  async function load() {
    setLoading(true);
    const email = getAdminEmail();
    const res = await fetch(`/api/admin/learning-paths?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setPaths(data.paths ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(p: LearningPath) {
    setEditId(p.id);
    setForm({ name: p.name, description: p.description, level: p.level, is_premium: p.is_premium, order_index: p.order_index });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const email = getAdminEmail();
    const url = editId ? `/api/admin/learning-paths/${editId}` : '/api/admin/learning-paths';
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...form }),
    });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta ruta de aprendizaje? Se eliminarán todos sus módulos y lecciones.')) return;
    const email = getAdminEmail();
    await fetch(`/api/admin/learning-paths/${id}?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    load();
  }

  async function handleSeed() {
    if (!confirm('¿Insertar contenido de prueba? Solo hazlo una vez.')) return;
    setSeeding(true);
    const email = getAdminEmail();
    const res = await fetch('/api/admin/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    alert(`Seed completado: ${data.created?.paths} rutas, ${data.created?.modules} módulos, ${data.created?.lessons} lecciones`);
    setSeeding(false);
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-bold text-xl">Rutas de Aprendizaje</h1>
          <p className="text-slate-500 text-sm mt-0.5">{paths.length} rutas</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-white/10 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            <Database size={12} />
            {seeding ? 'Seeding...' : 'Seed inicial'}
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] font-bold transition-colors"
          >
            <Plus size={12} />
            Nueva ruta
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[#00E0FF]/20 p-6 flex flex-col gap-4" style={{ background: 'rgba(0,224,255,0.02)' }}>
          <h2 className="text-white font-bold text-sm">{editId ? 'Editar ruta' : 'Nueva ruta'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">Nombre *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">Nivel *</label>
              <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                className="rounded-xl px-3 py-2 text-sm text-white outline-none appearance-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500">Descripción</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className="rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
              <input type="checkbox" checked={form.is_premium} onChange={e => setForm(f => ({ ...f, is_premium: e.target.checked }))} className="accent-[#00E0FF]" />
              Premium
            </label>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Orden</label>
              <input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))}
                className="w-16 rounded-xl px-2 py-1 text-sm text-white outline-none text-center"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving || !form.name}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] disabled:opacity-40 transition-all">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {loading ? (
          <p className="text-slate-500 text-sm p-6">Cargando...</p>
        ) : paths.length === 0 ? (
          <p className="text-slate-500 text-sm p-6 text-center">No hay rutas. Crea una o usa el seed inicial.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {paths.map(p => (
              <div key={p.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.015] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{p.name}</span>
                      {p.is_premium && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,224,255,0.1)', color: '#00E0FF' }}>Pro</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold" style={{ color: NIVEL_COLOR[p.level] ?? '#94a3b8' }}>{p.level}</span>
                      <span className="text-xs text-slate-600">{p.modules?.[0]?.count ?? 0} módulos</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/modules?path_id=${p.id}&path_name=${encodeURIComponent(p.name)}`}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Módulos <ChevronRight size={11} />
                  </Link>
                  <button onClick={() => openEdit(p)} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
