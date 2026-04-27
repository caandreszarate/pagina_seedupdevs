import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';
import { matchTeams } from '@/lib/matching';
import { validateCronRequest, unauthorizedCronResponse } from '@/lib/cron-auth';

export async function GET(req: NextRequest) {
  if (!validateCronRequest(req)) return unauthorizedCronResponse(req);
  const result = await matchTeams();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(req: NextRequest) {
  let body: { admin_email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const adminId = body.admin_email ? await verifyAdminByEmail(body.admin_email) : null;
  if (!adminId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const result = await matchTeams();
  return NextResponse.json({ ok: true, ...result });
}
