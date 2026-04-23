import { Resend } from 'resend';
import type { Nivel } from '@/types/evaluacion';

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY no configurada');
  return new Resend(key);
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'SeedUp Devs <onboarding@resend.dev>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://seedupdevs.vercel.app';

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

function htmlBase(body: string): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>SeedUp Devs</title></head><body style="margin:0;padding:0;background:#05070D;font-family:system-ui,-apple-system,sans-serif;color:#e2e8f0">${body}</body></html>`;
}

function welcomeHtml(nombres: string, nivel: Nivel, email: string): string {
  const color = NIVEL_COLOR[nivel];
  const label = NIVEL_LABEL[nivel];
  const discordUrl = `${SITE_URL}/api/discord/login?email=${encodeURIComponent(email)}`;
  return htmlBase(`
    <div style="max-width:560px;margin:40px auto;padding:40px 32px;background:#0D1117;border-radius:16px;border:1px solid rgba(255,255,255,0.06)">
      <p style="margin:0 0 4px;font-size:12px;font-family:monospace;text-transform:uppercase;letter-spacing:0.15em;color:#00E0FF">SeedUp Devs</p>
      <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#ffffff">¡Bienvenido, ${nombres}!</h1>
      <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;line-height:1.6">Ya eres parte de la comunidad. Completaste tu evaluación inicial y obtuviste tu nivel.</p>

      <div style="background:rgba(255,255,255,0.03);border:1px solid ${color}44;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px">
        <p style="margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#64748b;font-family:monospace">Tu nivel inicial</p>
        <p style="margin:0;font-size:30px;font-weight:900;color:${color}">${label}</p>
      </div>

      <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6">Conecta tu cuenta de Discord para recibir tu rol en el servidor y acceder a los canales de tu nivel.</p>

      <a href="${discordUrl}" style="display:inline-block;padding:14px 28px;background:#5865F2;color:#ffffff;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;border-radius:10px">Conectar Discord →</a>

      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0 20px">
      <p style="margin:0;font-size:12px;color:#475569">SeedUp Devs · Construyendo la próxima generación de developers</p>
    </div>
  `);
}

function followupHtml(nombres: string, email: string): string {
  const feedbackUrl = `${SITE_URL}/dashboard?email=${encodeURIComponent(email)}&source=email`;
  return htmlBase(`
    <div style="max-width:560px;margin:40px auto;padding:40px 32px;background:#0D1117;border-radius:16px;border:1px solid rgba(255,255,255,0.06)">
      <p style="margin:0 0 4px;font-size:12px;font-family:monospace;text-transform:uppercase;letter-spacing:0.15em;color:#00E0FF">SeedUp Devs</p>
      <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#ffffff">¿Cómo va tu aprendizaje, ${nombres}?</h1>
      <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;line-height:1.6">Han pasado unos días desde que te uniste a la comunidad. Nos gustaría saber si te está ayudando a crecer como desarrollador.</p>

      <p style="margin:0 0 28px;color:#94a3b8;font-size:14px;line-height:1.6">Tu feedback (de 1 a 5 estrellas) nos ayuda a mejorar la experiencia para todos los miembros.</p>

      <a href="${feedbackUrl}" style="display:inline-block;padding:14px 28px;background:#00E0FF;color:#05070D;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.08em;text-decoration:none;border-radius:10px">Dar mi feedback →</a>

      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:32px 0 20px">
      <p style="margin:0;font-size:12px;color:#475569">SeedUp Devs · Si no quieres recibir más emails, ignora este mensaje.</p>
    </div>
  `);
}

export async function sendWelcomeEmail(opts: {
  to: string;
  nombres: string;
  nivel: Nivel;
}): Promise<boolean> {
  try {
    await getResend().emails.send({
      from: FROM,
      to: opts.to,
      subject: `¡Bienvenido a SeedUp Devs, ${opts.nombres}!`,
      html: welcomeHtml(opts.nombres, opts.nivel, opts.to),
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendFollowupEmail(opts: {
  to: string;
  nombres: string;
}): Promise<boolean> {
  try {
    await getResend().emails.send({
      from: FROM,
      to: opts.to,
      subject: '¿Cómo va tu aprendizaje en SeedUp Devs?',
      html: followupHtml(opts.nombres, opts.to),
    });
    return true;
  } catch {
    return false;
  }
}
