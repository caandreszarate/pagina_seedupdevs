import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { applyLevelUpdate } from '@/app/api/update-level/route';
import { sendWelcomeEmail } from '@/lib/email';
import { sendDiscordMessage } from '@/lib/discord';
import type { ResultadoEvaluacion, Nivel } from '@/types/evaluacion';

interface SaveUserBody {
  nombres?: string;
  apellidos?: string;
  email: string;
  telefono?: string;
  resultado: ResultadoEvaluacion;
}

function validarTelefono(tel: string): boolean {
  const soloDigitos = tel.replace(/[\s\-().+]/g, '');
  return /^\d{10,15}$/.test(soloDigitos);
}

function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: SaveUserBody;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { nombres, apellidos, email, telefono, resultado } = body;

  if (!email?.trim()) {
    return NextResponse.json({ error: 'Email es obligatorio' }, { status: 400 });
  }

  if (!validarEmail(email.trim())) {
    return NextResponse.json({ error: 'El email no tiene un formato válido' }, { status: 400 });
  }

  if (!resultado?.nivel || typeof resultado.score !== 'number') {
    return NextResponse.json({ error: 'Resultado de evaluación inválido' }, { status: 400 });
  }

  const emailNorm = email.trim().toLowerCase();

  // ── Buscar usuario existente ────────────────────────────────────────────
  const { data: usuarioExistente } = await supabaseAdmin
    .from('users')
    .select('id, nombres, last_evaluation_at')
    .eq('email', emailNorm)
    .maybeSingle();

  let userId: string;
  let nombreEnDB: string | null = null;

  if (usuarioExistente) {
    // Usuario ya registrado — solo necesitamos el email
    userId = usuarioExistente.id;
    nombreEnDB = usuarioExistente.nombres ?? null;

    // Cooldown: re-verificar antes de persistir (evita bypass directo a este endpoint)
    if (usuarioExistente.last_evaluation_at) {
      const msSince = Date.now() - new Date(usuarioExistente.last_evaluation_at).getTime();
      const daysSince = msSince / (1000 * 60 * 60 * 24);
      if (daysSince < 7) {
        const daysLeft = Math.ceil(7 - daysSince);
        return NextResponse.json(
          {
            error: 'cooldown',
            message: `Debes esperar ${daysLeft} día${daysLeft === 1 ? '' : 's'} antes de volver a evaluar`,
            daysLeft,
          },
          { status: 429 },
        );
      }
    }
  } else {
    // Usuario nuevo — requiere todos los campos
    if (!nombres?.trim() || !apellidos?.trim() || !telefono?.trim()) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    if (!validarTelefono(telefono.trim())) {
      return NextResponse.json(
        { error: 'El teléfono debe tener entre 10 y 15 dígitos' },
        { status: 400 },
      );
    }

    const { data: nuevoUsuario, error: errInsert } = await supabaseAdmin
      .from('users')
      .insert({
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: emailNorm,
        telefono: telefono.trim(),
      })
      .select('id')
      .single();

    if (errInsert || !nuevoUsuario) {
      return NextResponse.json({ error: 'Error al guardar usuario' }, { status: 500 });
    }

    userId = nuevoUsuario.id;

    // Enviar welcome email al nuevo usuario (fire-and-forget, no bloquea la respuesta)
    const sent = await sendWelcomeEmail({
      to: emailNorm,
      nombres: nombres.trim(),
      nivel: resultado.nivel as Nivel,
    });

    await supabaseAdmin.from('communications_log').insert({
      user_id: userId,
      type: 'welcome',
      status: sent ? 'sent' : 'failed',
    });

    if (sent) {
      await supabaseAdmin
        .from('users')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', userId);
    }
  }

  // ── Insertar evaluación ─────────────────────────────────────────────────
  const { error: errEval } = await supabaseAdmin.from('evaluations').insert({
    user_id: userId,
    nivel: resultado.nivel,
    score: resultado.score,
    fortalezas: resultado.fortalezas,
    debilidades: resultado.debilidades,
  });

  if (errEval) {
    return NextResponse.json({ error: 'Error al guardar evaluación' }, { status: 500 });
  }

  // ── Registrar fecha de evaluación (para cooldown) ───────────────────────
  await supabaseAdmin
    .from('users')
    .update({ last_evaluation_at: new Date().toISOString() })
    .eq('id', userId);

  // ── Aplicar lógica de progresión de nivel ───────────────────────────────
  const levelResult = await applyLevelUpdate(userId, resultado.nivel as Nivel);

  // ── Notificaciones a Discord (#logros) ──────────────────────────────────
  const displayName = nombres?.trim() || nombreEnDB || emailNorm;
  if (levelResult.upgraded) {
    void sendDiscordMessage(`🔥 ${displayName} subió a ${levelResult.new_level} 🚀`);
  } else {
    void sendDiscordMessage(`🧠 ${displayName} completó la evaluación`);
  }

  // ── Contar evaluaciones del usuario ────────────────────────────────────
  const { count } = await supabaseAdmin
    .from('evaluations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  return NextResponse.json({
    ok: true,
    upgraded: levelResult.upgraded,
    previous_level: levelResult.previous_level,
    new_level: levelResult.new_level,
    total_evaluaciones: count ?? 1,
  });
}
