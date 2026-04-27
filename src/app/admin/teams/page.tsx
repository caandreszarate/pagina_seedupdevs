'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, ClipboardList, Loader2, CheckCircle2, Zap } from 'lucide-react';

const NIVELES = ['dev-zero', 'dev-bronce', 'dev-silver', 'dev-gold', 'dev-platinum'];
const NIVEL_COLOR: Record<string, string> = {
  'dev-zero': '#94a3b8',
  'dev-bronce': '#cd7f32',
  'dev-silver': '#C0C0C0',
  'dev-gold': '#FFD700',
  'dev-platinum': '#00E0FF',
};
const NIVEL_LABEL: Record<string, string> = {
  'dev-zero': 'Dev Zero',
  'dev-bronce': 'Dev Bronce',
  'dev-silver': 'Dev Silver',
  'dev-gold': 'Dev Gold',
  'dev-platinum': 'Dev Platinum',
};

interface Team {
  id: string;
  name: string;
  level: string;
  status: string;
  member_count: number;
}

interface Application {
  id: string;
  level: string;
  stack: string;
  availability: string;
  status: string;
  created_at: string;
  users: { id: string; nombres: string; apellidos: string; email: string } | null;
}

function getAdminEmail() {
  return typeof window !== 'undefined'
    ? (sessionStorage.getItem('seedup_admin_email') ?? '')
    : '';
}

export default function AdminTeamsPage() {
  const [tab, setTab] = useState<'teams' | 'applications'>('applications');
  const [teams, setTeams] = useState<Team[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Create team form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState('dev-zero');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Match state
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<{ teamsFormed: number; teamsSkipped: number; errors: string[] } | null>(null);

  // Assign state: application id → selected team id
  const [assigning, setAssigning] = useState<Record<string, string>>({});
  const [assignLoading, setAssignLoading] = useState<Record<string, boolean>>({});
  const [assignError, setAssignError] = useState<Record<string, string>>({});
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());

  async function loadAll() {
    setLoading(true);
    const email = getAdminEmail();
    const [teamsRes, appsRes] = await Promise.all([
      fetch('/api/teams'),
      fetch(`/api/teams/applications?email=${encodeURIComponent(email)}`),
    ]);
    const teamsData = await teamsRes.json();
    const appsData = await appsRes.json();
    setTeams(teamsData.teams ?? []);
    setApplications(appsData.applications ?? []);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function handleCreateTeam(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: getAdminEmail(), name: newName, level: newLevel }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error ?? 'Error al crear equipo');
        return;
      }
      setNewName('');
      setNewLevel('dev-zero');
      setShowCreateForm(false);
      await loadAll();
    } catch {
      setCreateError('Error de conexión');
    } finally {
      setCreating(false);
    }
  }

  async function handleAssign(app: Application) {
    const teamId = assigning[app.id];
    if (!teamId || !app.users) return;
    setAssignLoading((prev) => ({ ...prev, [app.id]: true }));
    setAssignError((prev) => ({ ...prev, [app.id]: '' }));
    try {
      const res = await fetch('/api/teams/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_email: getAdminEmail(),
          team_id: teamId,
          user_ids: [app.users.id],
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAssignError((prev) => ({ ...prev, [app.id]: data.error ?? 'Error al asignar' }));
        return;
      }
      setAssignedIds((prev) => new Set([...prev, app.id]));
    } catch {
      setAssignError((prev) => ({ ...prev, [app.id]: 'Error de conexión' }));
    } finally {
      setAssignLoading((prev) => ({ ...prev, [app.id]: false }));
    }
  }

  async function handleMatch() {
    setMatching(true);
    setMatchResult(null);
    try {
      const res = await fetch('/api/teams/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: getAdminEmail() }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatchResult(data);
        await loadAll();
      } else {
        setMatchResult({ teamsFormed: 0, teamsSkipped: 0, errors: [data.error ?? 'Error al ejecutar matching'] });
      }
    } catch {
      setMatchResult({ teamsFormed: 0, teamsSkipped: 0, errors: ['Error de conexión'] });
    } finally {
      setMatching(false);
    }
  }

  const teamsForLevel = (level: string) => teams.filter((t) => t.level === level);

  return (
    <div
      className="min-h-screen px-4 py-10"
      style={{ background: '#05070D', color: 'white' }}
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black">Equipos</h1>
          <div className="flex gap-2">
            <button
              onClick={handleMatch}
              disabled={matching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
              style={{
                background: 'rgba(0,224,255,0.1)',
                border: '1px solid rgba(0,224,255,0.3)',
                color: '#00E0FF',
              }}
            >
              {matching ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
              {matching ? 'Ejecutando...' : 'Auto-matching'}
            </button>
            <button
              onClick={() => setTab('applications')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === 'applications' ? 'rgba(0,224,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${tab === 'applications' ? 'rgba(0,224,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: tab === 'applications' ? '#00E0FF' : '#94a3b8',
              }}
            >
              <ClipboardList size={13} />
              Aplicaciones
              {applications.length > 0 && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: '#00E0FF', color: '#05070D' }}
                >
                  {applications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('teams')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: tab === 'teams' ? 'rgba(0,224,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${tab === 'teams' ? 'rgba(0,224,255,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color: tab === 'teams' ? '#00E0FF' : '#94a3b8',
              }}
            >
              <Users size={13} />
              Equipos
            </button>
          </div>
        </div>

        {matchResult && (
          <div
            className="rounded-xl border px-4 py-3 text-xs flex flex-col gap-1"
            style={{
              background: matchResult.errors.length > 0 ? 'rgba(239,68,68,0.06)' : 'rgba(0,224,255,0.06)',
              borderColor: matchResult.errors.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(0,224,255,0.2)',
            }}
          >
            <p style={{ color: matchResult.errors.length > 0 ? '#f87171' : '#00E0FF' }} className="font-semibold">
              {matchResult.teamsFormed > 0
                ? `${matchResult.teamsFormed} equipo${matchResult.teamsFormed !== 1 ? 's' : ''} formado${matchResult.teamsFormed !== 1 ? 's' : ''}`
                : 'No se formaron equipos'}
              {matchResult.teamsSkipped > 0 && ` · ${matchResult.teamsSkipped} usuario${matchResult.teamsSkipped !== 1 ? 's' : ''} sin equipo (grupo insuficiente)`}
            </p>
            {matchResult.errors.map((e, i) => (
              <p key={i} className="text-red-400">{e}</p>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 py-16 justify-center">
            <Loader2 size={18} className="animate-spin text-slate-500" />
            <span className="text-slate-500 text-sm">Cargando...</span>
          </div>
        ) : (
          <>
            {/* ── Tab: Aplicaciones ── */}
            {tab === 'applications' && (
              <div className="flex flex-col gap-3">
                {applications.length === 0 && (
                  <p className="text-slate-600 text-sm text-center py-12">
                    No hay aplicaciones pendientes.
                  </p>
                )}
                {applications.map((app) => {
                  const isAssigned = assignedIds.has(app.id);
                  const compatibleTeams = teamsForLevel(app.level);
                  return (
                    <div
                      key={app.id}
                      className="rounded-2xl border border-white/6 p-5 flex flex-col gap-4"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-white font-semibold text-sm">
                            {app.users
                              ? `${app.users.nombres} ${app.users.apellidos}`
                              : 'Usuario desconocido'}
                          </p>
                          <p className="text-xs text-slate-600">{app.users?.email}</p>
                        </div>
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            color: NIVEL_COLOR[app.level] ?? '#94a3b8',
                            background: (NIVEL_COLOR[app.level] ?? '#94a3b8') + '18',
                            border: `1px solid ${(NIVEL_COLOR[app.level] ?? '#94a3b8')}33`,
                          }}
                        >
                          {NIVEL_LABEL[app.level] ?? app.level}
                        </span>
                      </div>

                      <div className="flex gap-4 text-xs text-slate-400">
                        <span><span className="text-slate-600">Stack:</span> {app.stack}</span>
                        <span><span className="text-slate-600">Disponibilidad:</span> {app.availability}</span>
                      </div>

                      {isAssigned ? (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-400" />
                          <span className="text-xs text-emerald-400 font-semibold">Asignado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          {compatibleTeams.length === 0 ? (
                            <p className="text-xs text-amber-500">
                              No hay equipos {NIVEL_LABEL[app.level] ?? app.level}. Crea uno primero.
                            </p>
                          ) : (
                            <>
                              <select
                                value={assigning[app.id] ?? ''}
                                onChange={(e) =>
                                  setAssigning((prev) => ({ ...prev, [app.id]: e.target.value }))
                                }
                                className="flex-1 rounded-lg px-3 py-2 text-xs text-white outline-none"
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                }}
                              >
                                <option value="">Seleccionar equipo...</option>
                                {compatibleTeams.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ({t.member_count} miembros)
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssign(app)}
                                disabled={!assigning[app.id] || assignLoading[app.id]}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                              >
                                {assignLoading[app.id] && <Loader2 size={12} className="animate-spin" />}
                                Asignar
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {assignError[app.id] && (
                        <p className="text-xs text-red-400">{assignError[app.id]}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Tab: Equipos ── */}
            {tab === 'teams' && (
              <div className="flex flex-col gap-4">
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCreateForm((v) => !v)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] transition-all"
                  >
                    <Plus size={15} />
                    Nuevo equipo
                  </button>
                </div>

                {showCreateForm && (
                  <form
                    onSubmit={handleCreateTeam}
                    className="rounded-2xl border border-white/6 p-5 flex flex-col gap-4"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <p className="text-sm font-semibold text-white">Nuevo equipo</p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Nombre del equipo"
                        className="flex-1 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      />
                      <select
                        value={newLevel}
                        onChange={(e) => setNewLevel(e.target.value)}
                        className="rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {NIVELES.map((n) => (
                          <option key={n} value={n}>{NIVEL_LABEL[n]}</option>
                        ))}
                      </select>
                    </div>
                    {createError && <p className="text-xs text-red-400">{createError}</p>}
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!newName.trim() || creating}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] disabled:opacity-40 transition-all"
                      >
                        {creating && <Loader2 size={12} className="animate-spin" />}
                        Crear equipo
                      </button>
                    </div>
                  </form>
                )}

                {teams.length === 0 && !showCreateForm && (
                  <p className="text-slate-600 text-sm text-center py-12">
                    No hay equipos creados aún.
                  </p>
                )}

                <div className="flex flex-col gap-3">
                  {teams.map((team) => (
                    <div
                      key={team.id}
                      className="rounded-2xl border border-white/6 px-5 py-4 flex items-center justify-between gap-4"
                      style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: (NIVEL_COLOR[team.level] ?? '#94a3b8') + '18' }}
                        >
                          <Users size={14} style={{ color: NIVEL_COLOR[team.level] ?? '#94a3b8' }} />
                        </div>
                        <div>
                          <p className="text-sm text-white font-semibold">{team.name}</p>
                          <p className="text-xs" style={{ color: NIVEL_COLOR[team.level] ?? '#94a3b8' }}>
                            {NIVEL_LABEL[team.level] ?? team.level}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {team.member_count} miembro{team.member_count !== 1 ? 's' : ''}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: '#94a3b8',
                          }}
                        >
                          {team.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
