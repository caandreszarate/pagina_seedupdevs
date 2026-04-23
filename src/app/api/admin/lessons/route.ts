import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  const moduleId = req.nextUrl.searchParams.get('module_id') ?? '';

  if (!await verifyAdminByEmail(email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  let query = supabaseAdmin.from('lessons').select('*').order('order_index');
  if (moduleId) query = query.eq('module_id', moduleId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lessons: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, module_id, title, content, is_premium, duration_minutes, order_index } = body;

  if (!await verifyAdminByEmail(email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  if (!module_id || !title) {
    return NextResponse.json({ error: 'module_id y title requeridos' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('lessons')
    .insert({
      module_id,
      title,
      content: content ?? '',
      is_premium: is_premium ?? false,
      duration_minutes: duration_minutes ?? 5,
      order_index: order_index ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data }, { status: 201 });
}
