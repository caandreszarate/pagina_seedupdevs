import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminByEmail } from '@/lib/admin';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as {
    admin_email: string;
    mentor_user_id: string;
    mentee_user_id: string;
  };

  const isAdmin = await verifyAdminByEmail(body.admin_email);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  if (!body.mentor_user_id || !body.mentee_user_id) {
    return NextResponse.json({ error: 'mentor_user_id y mentee_user_id requeridos' }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from('mentor_sessions').insert({
    mentor_user_id: body.mentor_user_id,
    mentee_user_id: body.mentee_user_id,
    status: 'pending',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
