'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Module {
  id: string; title: string; description: string; order_index: number;
  lessons: { count: number }[];
}

interface FormState { title: string; description: string; order_index: number; }
const EMPTY_FORM: FormState = { title: '', description: '', order_index: 0 };

function getAdminEmail() {
  return typeof window !== 'undefined' ? (sessionStorage.getItem('seedup_admin_email') ?? '') : '';
}

function ModulesContent() {
  const searchParams = useSearchParams();
  const pathId = searchParams.get('path_id') ?? '';
  const pathName = searchParams.get('path_name') ?? 'Ruta';

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!pathId) return;
    setLoading(true);
    const email = getAdminEmail();
    const res = await fetch(`/api/admin/modules?email=${encodeURIComponent(email)}&path_id=${pathId}`);
    const data = await res.json();
    setModules(data.modules ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [pathId]);

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setShowForm(true); }
  function openEdit(m: Module) {
    setEditId(m.id);
    setForm({ title: m.title, description: m.description, order_index: m.order_index });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const email = getAdminEmail();
    const url = editId ? `/api/admin/modules/${editId}` : '/api/admin/modules';
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, learning_path_id: pathId, ...form }),
    });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return;
    const email = getAdminEmail();
    await fetch(`/api/admin/modules/${id}?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/learning-paths" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 mb-1 transition-colors w-fit">
            <ArrowLeft size={12} /> {pathName}
          </Link>
          <h1 className="text-white font-bold text-xl">Módulos</h1>
          <p className="text-slate-500 text-sm mt-0.5">{modules.length} módulos</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] font-bold transition-colors"
        >
          <Plus size={12} />
          Nuevo módulo
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[#00E0FF]/20 p-6 flex flex-col gap-4" style={{ background: 'rgba(0,224,255,0.02)' }}>
          <h2 className="text-white font-bold text-sm">{editId ? 'Editar módulo' : 'Nuevo módulo'}</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500">Título *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="rounded-xl px-3 py-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500">Descripción</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className="rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Orden</label>
            <input type="number" value={form.order_index} onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))}
              className="w-16 rounded-xl px-2 py-1 text-sm text-white outline-none text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving || !form.title}
              className="px-4 py-2 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] disabled:opacity-40 transition-all">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-300">Cancelar</button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
        {loading ? (
          <p className="text-slate-500 text-sm p-6">Cargando...</p>
        ) : modules.length === 0 ? (
          <p className="text-slate-500 text-sm p-6 text-center">No hay módulos en esta ruta.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {modules.map(m => (
              <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-white/[0.015] transition-colors">
                <div>
                  <p className="text-white font-medium text-sm">{m.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{m.lessons?.[0]?.count ?? 0} lecciones</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/lessons?module_id=${m.id}&module_name=${encodeURIComponent(m.title)}&path_id=${pathId}&path_name=${encodeURIComponent(pathName)}`}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Lecciones <ChevronRight size={11} />
                  </Link>
                  <button onClick={() => openEdit(m)} className="p-1.5 text-slate-600 hover:text-slate-300"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-600 hover:text-red-400"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminModulesPage() {
  return <Suspense fallback={<p className="text-slate-500 text-sm">Cargando...</p>}><ModulesContent /></Suspense>;
}
