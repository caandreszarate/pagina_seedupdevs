'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface Lesson {
  id: string; title: string; content: string; is_premium: boolean;
  duration_minutes: number; order_index: number;
}

interface FormState {
  title: string; content: string; is_premium: boolean;
  duration_minutes: number; order_index: number;
}

const EMPTY_FORM: FormState = { title: '', content: '', is_premium: false, duration_minutes: 5, order_index: 0 };

function getAdminEmail() {
  return typeof window !== 'undefined' ? (sessionStorage.getItem('seedup_admin_email') ?? '') : '';
}

function LessonsContent() {
  const searchParams = useSearchParams();
  const moduleId = searchParams.get('module_id') ?? '';
  const moduleName = searchParams.get('module_name') ?? 'Módulo';
  const pathId = searchParams.get('path_id') ?? '';
  const pathName = searchParams.get('path_name') ?? 'Ruta';

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  async function load() {
    if (!moduleId) return;
    setLoading(true);
    const email = getAdminEmail();
    const res = await fetch(`/api/admin/lessons?email=${encodeURIComponent(email)}&module_id=${moduleId}`);
    const data = await res.json();
    setLessons(data.lessons ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [moduleId]);

  function openCreate() { setEditId(null); setForm(EMPTY_FORM); setPreview(false); setShowForm(true); }

  async function openEdit(l: Lesson) {
    const email = getAdminEmail();
    const res = await fetch(`/api/admin/lessons/${l.id}?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    setEditId(l.id);
    setForm({
      title: data.lesson.title, content: data.lesson.content,
      is_premium: data.lesson.is_premium, duration_minutes: data.lesson.duration_minutes,
      order_index: data.lesson.order_index,
    });
    setPreview(false);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const email = getAdminEmail();
    const url = editId ? `/api/admin/lessons/${editId}` : '/api/admin/lessons';
    const method = editId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, module_id: moduleId, ...form }),
    });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta lección?')) return;
    const email = getAdminEmail();
    await fetch(`/api/admin/lessons/${id}?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <Link href="/admin/learning-paths" className="hover:text-slate-300 transition-colors">{pathName}</Link>
            <span>/</span>
            <Link href={`/admin/modules?path_id=${pathId}&path_name=${encodeURIComponent(pathName)}`} className="hover:text-slate-300 transition-colors">{moduleName}</Link>
          </div>
          <h1 className="text-white font-bold text-xl">Lecciones</h1>
          <p className="text-slate-500 text-sm mt-0.5">{lessons.length} lecciones</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] font-bold transition-colors"
        >
          <Plus size={12} />
          Nueva lección
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-[#00E0FF]/20 p-6 flex flex-col gap-4" style={{ background: 'rgba(0,224,255,0.02)' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold text-sm">{editId ? 'Editar lección' : 'Nueva lección'}</h2>
            <button
              onClick={() => setPreview(v => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {preview ? <EyeOff size={12} /> : <Eye size={12} />}
              {preview ? 'Editor' : 'Preview'}
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-slate-500">Título *</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
            </div>
            <div className="flex items-end gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Duración (min)</label>
                <input type="number" value={form.duration_minutes}
                  onChange={e => setForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                  className="w-20 rounded-xl px-2 py-2 text-sm text-white outline-none text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-500">Orden</label>
                <input type="number" value={form.order_index}
                  onChange={e => setForm(f => ({ ...f, order_index: Number(e.target.value) }))}
                  className="w-16 rounded-xl px-2 py-2 text-sm text-white outline-none text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer mb-0.5">
                <input type="checkbox" checked={form.is_premium}
                  onChange={e => setForm(f => ({ ...f, is_premium: e.target.checked }))}
                  className="accent-[#00E0FF]" />
                Premium
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-500">Contenido (Markdown)</label>
            {preview ? (
              <div
                className="rounded-xl px-4 py-3 min-h-[200px] prose prose-invert prose-sm max-w-none text-slate-300"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
                dangerouslySetInnerHTML={{ __html: form.content.replace(/\n/g, '<br/>') }}
              />
            ) : (
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={12}
                placeholder="# Título de la lección&#10;&#10;Contenido en markdown..."
                className="rounded-xl px-3 py-2 text-sm text-white outline-none resize-y font-mono"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
            )}
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
        ) : lessons.length === 0 ? (
          <p className="text-slate-500 text-sm p-6 text-center">No hay lecciones en este módulo.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3">Lección</th>
                <th className="text-left text-xs font-mono uppercase tracking-widest text-slate-500 px-4 py-3 hidden md:table-cell">Duración</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.015] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{l.title}</span>
                      {l.is_premium && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(0,224,255,0.1)', color: '#00E0FF' }}>Pro</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{l.duration_minutes}min</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(l)} className="p-1.5 text-slate-600 hover:text-slate-300"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(l.id)} className="p-1.5 text-slate-600 hover:text-red-400"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function AdminLessonsPage() {
  return <Suspense fallback={<p className="text-slate-500 text-sm">Cargando...</p>}><LessonsContent /></Suspense>;
}
