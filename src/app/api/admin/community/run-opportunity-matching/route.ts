import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';
import { runOpportunityMatching } from '@/lib/opportunity-matching';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { email?: string } = {};
  try {
    body = await req.json() as { email?: string };
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  if (!body.email) {
    return NextResponse.json({ error: 'email requerido' }, { status: 400 });
  }

  const isAdmin = await verifyAdminByEmail(body.email);
  if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  try {
    const result = await runOpportunityMatching();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
