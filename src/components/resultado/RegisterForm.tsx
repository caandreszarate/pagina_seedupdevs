'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, TrendingUp, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import type { ResultadoEvaluacion, Nivel } from '@/types/evaluacion';
import FeedbackForm from '@/components/feedback/FeedbackForm';

interface Props {
  resultado: ResultadoEvaluacion;
  discordStatus: string | null;
  discordUsername: string;
  discordError: string;
}

interface Campos {
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
}

interface Errores {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
}

interface UpgradeInfo {
  upgraded: boolean;
  previous_level: Nivel | null;
  new_level: Nivel;
  total_evaluaciones: number;
}

const NIVEL_LABEL: Record<Nivel, string> = {
  'dev-zero':     'Dev Zero',
  'dev-bronce':   'Dev Bronce',
  'dev-silver':   'Dev Silver',
  'dev-gold':     'Dev Gold',
  'dev-platinum': 'Dev Platinum',
};

const NIVEL_COLOR: Record<Nivel, string> = {
  'dev-zero':     '#94a3b8',
  'dev-bronce':   '#cd7f32',
  'dev-silver':   '#C0C0C0',
  'dev-gold':     '#FFD700',
  'dev-platinum': '#00E0FF',
};

function validarCampos(campos: Campos): Errores {
  const errores: Errores = {};

  if (!campos.nombres.trim()) errores.nombres = 'Campo obligatorio';
  if (!campos.apellidos.trim()) errores.apellidos = 'Campo obligatorio';

  if (!campos.email.trim()) {
    errores.email = 'Campo obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email.trim())) {
    errores.email = 'Formato de email inválido';
  }

  if (!campos.telefono.trim()) {
    errores.telefono = 'Campo obligatorio';
  } else {
    const soloDigitos = campos.telefono.replace(/[\s\-().+]/g, '');
    if (!/^\d{10,15}$/.test(soloDigitos)) {
      errores.telefono = 'Mínimo 10 dígitos (puede incluir +57...)';
    }
  }

  return errores;
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
    </svg>
  );
}

function UpgradeBadge({ info }: { info: UpgradeInfo }) {
  if (!info.upgraded || !info.previous_level) return null;

  const prevColor = NIVEL_COLOR[info.previous_level];
  const newColor  = NIVEL_COLOR[info.new_level];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="rounded-xl p-4 mb-5 text-center"
      style={{ background: 'rgba(0,224,255,0.06)', border: '1px solid rgba(0,224,255,0.2)' }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <TrendingUp size={15} style={{ color: '#00E0FF' }} />
        <span className="text-xs font-mono uppercase tracking-widest" style={{ color: '#00E0FF' }}>
          ¡Subiste de nivel!
        </span>
      </div>
      <div className="flex items-center justify-center gap-3 text-sm font-bold">
        <span style={{ color: prevColor }}>{NIVEL_LABEL[info.previous_level]}</span>
        <span className="text-slate-600">→</span>
        <span style={{ color: newColor }}>{NIVEL_LABEL[info.new_level]}</span>
      </div>
    </motion.div>
  );
}

export default function RegisterForm({ resultado, discordStatus, discordUsername, discordError }: Props) {
  const [campos, setCampos] = useState<Campos>({
    nombres: '',
    apellidos: '',
    email: '',
    telefono: '',
  });
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState('');
  const [exito, setExito] = useState(false);
  const [emailRegistrado, setEmailRegistrado] = useState('');
  const [upgradeInfo, setUpgradeInfo] = useState<UpgradeInfo | null>(null);

  // Auto-save para usuarios que regresan (email en sessionStorage, eval no guardada aún)
  useEffect(() => {
    const savedEmail = sessionStorage.getItem('seedup_registro_email');
    const alreadySaved = sessionStorage.getItem('seedup_eval_saved');

    if (savedEmail && alreadySaved) {
      // Misma sesión, eval ya guardada — solo mostrar éxito
      setEmailRegistrado(savedEmail);
      setExito(true);
      return;
    }

    if (savedEmail && !alreadySaved) {
      // Usuario conocido, nueva evaluación — auto-guardar
      setEnviando(true);
      fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: savedEmail, resultado }),
      })
        .then(r => r.json())
        .then(data => {
          sessionStorage.setItem('seedup_eval_saved', 'true');
          setEmailRegistrado(savedEmail);
          setUpgradeInfo({
            upgraded:           data.upgraded ?? false,
            previous_level:     data.previous_level ?? null,
            new_level:          data.new_level ?? resultado.nivel,
            total_evaluaciones: data.total_evaluaciones ?? 1,
          });
          setExito(true);
        })
        .catch(() => {
          // Si falla el auto-save, mostrar el formulario normal
        })
        .finally(() => setEnviando(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setCampos((prev) => ({ ...prev, [name]: value }));
    if (errores[name as keyof Errores]) {
      setErrores((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorServidor('');

    const nuevosErrores = validarCampos(campos);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setEnviando(true);

    try {
      const res = await fetch('/api/save-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...campos, resultado }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorServidor(data.error ?? 'Error al guardar. Intenta de nuevo.');
        return;
      }

      sessionStorage.setItem('seedup_registro_email', campos.email);
      sessionStorage.setItem('seedup_eval_saved', 'true');
      setEmailRegistrado(campos.email);
      setUpgradeInfo({
        upgraded:           data.upgraded ?? false,
        previous_level:     data.previous_level ?? null,
        new_level:          data.new_level ?? resultado.nivel,
        total_evaluaciones: data.total_evaluaciones ?? 1,
      });
      setExito(true);
    } catch {
      setErrorServidor('Error de conexión. Intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  if (enviando && !exito) {
    return (
      <div className="rounded-2xl border border-white/6 p-8 flex items-center justify-center gap-3"
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <Loader2 size={18} className="animate-spin text-slate-400" />
        <span className="text-slate-400 text-sm">Guardando tu resultado...</span>
      </div>
    );
  }

  if (exito) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-500/20 p-8 text-center"
        style={{ background: 'rgba(16,185,129,0.04)' }}
      >
        <CheckCircle2 className="mx-auto mb-3 text-emerald-400" size={36} />
        <p className="text-white font-bold text-lg mb-1">¡Registro completado!</p>
        <p className="text-slate-400 text-sm mb-5">
          Conecta tu Discord para recibir tu rol{' '}
          <span style={{ color: '#00E0FF' }}>{resultado.nivel}</span> automáticamente.
        </p>

        {/* Badge de subida de nivel */}
        {upgradeInfo && <UpgradeBadge info={upgradeInfo} />}

        {/* Historial básico */}
        {upgradeInfo && upgradeInfo.total_evaluaciones > 1 && (
          <p className="text-xs text-slate-600 mb-5">
            Evaluación #{upgradeInfo.total_evaluaciones} completada
          </p>
        )}

        {/* Discord */}
        {discordStatus === 'success' ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(88,101,242,0.15)', color: '#7289da', border: '1px solid rgba(88,101,242,0.3)' }}
            >
              <DiscordIcon />
              @{discordUsername}
            </div>
            <p className="text-emerald-400 text-xs font-mono uppercase tracking-widest mt-1">
              Rol asignado en el servidor ✓
            </p>
          </div>
        ) : discordStatus === 'error' ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle size={16} />
              {discordError || 'Error al conectar con Discord'}
            </div>
            <a
              href={`/api/discord/login?email=${encodeURIComponent(emailRegistrado)}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
              style={{ background: 'rgba(88,101,242,0.15)', color: '#7289da', border: '1px solid rgba(88,101,242,0.3)' }}
            >
              <RefreshCw size={14} />
              Reintentar
            </a>
          </div>
        ) : (
          <a
            href={`/api/discord/login?email=${encodeURIComponent(emailRegistrado)}`}
            className="btn-glow inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
            style={{ background: '#5865F2', color: '#ffffff' }}
          >
            <DiscordIcon />
            Conectar con Discord
          </a>
        )}

        {/* Feedback - al final, cuando el usuario ya vio todo */}
        <div className="mt-6">
          <FeedbackForm email={emailRegistrado} source="web" />
        </div>

        {/* Link al dashboard */}
        <Link
          href="/dashboard"
          className="mt-4 flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-[#00E0FF] hover:border-[#00E0FF]/30 text-sm font-semibold transition-all"
        >
          <LayoutDashboard size={15} />
          Ver mi progreso completo
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl border border-white/6 p-6 md:p-8"
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      <div className="mb-6">
        <h2 className="text-white font-bold text-lg mb-1">Completa tu registro</h2>
        <p className="text-slate-500 text-sm">
          Únete a la comunidad. Tus datos nos permiten hacer seguimiento de tu progreso.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field
            label="Nombres"
            name="nombres"
            value={campos.nombres}
            error={errores.nombres}
            onChange={handleChange}
            placeholder="Carlos"
          />
          <Field
            label="Apellidos"
            name="apellidos"
            value={campos.apellidos}
            error={errores.apellidos}
            onChange={handleChange}
            placeholder="Martínez"
          />
        </div>

        <Field
          label="Email"
          name="email"
          type="email"
          value={campos.email}
          error={errores.email}
          onChange={handleChange}
          placeholder="carlos@email.com"
        />

        <Field
          label="Teléfono"
          name="telefono"
          type="tel"
          value={campos.telefono}
          error={errores.telefono}
          onChange={handleChange}
          placeholder="+57 300 000 0000"
        />

        {errorServidor && (
          <p className="text-sm text-red-400 text-center">{errorServidor}</p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="btn-glow mt-2 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-[#05070D] bg-[#00E0FF] hover:bg-[#00F0FF] text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {enviando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Guardando...
            </>
          ) : (
            'Unirme a la comunidad'
          )}
        </button>
      </form>
    </motion.div>
  );
}

interface FieldProps {
  label: string;
  name: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}

function Field({ label, name, value, error, onChange, placeholder, type = 'text' }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-mono uppercase tracking-widest text-slate-500">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: error ? '0 0 0 1px rgba(248,113,113,0.2)' : undefined,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = error
            ? 'rgba(248,113,113,0.7)'
            : 'rgba(0,224,255,0.4)';
          if (!error) e.currentTarget.style.boxShadow = '0 0 0 1px rgba(0,224,255,0.15)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? 'rgba(248,113,113,0.5)'
            : 'rgba(255,255,255,0.08)';
          e.currentTarget.style.boxShadow = error ? '0 0 0 1px rgba(248,113,113,0.2)' : '';
        }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
