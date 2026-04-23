import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  if (!await verifyAdminByEmail(email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('learning_paths')
    .select('*, modules(count)')
    .order('order_index');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ paths: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, name, description, level, is_premium, order_index } = body;

  if (!await verifyAdminByEmail(email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  if (!name || !level) {
    return NextResponse.json({ error: 'name y level requeridos' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('learning_paths')
    .insert({ name, description: description ?? '', level, is_premium: is_premium ?? false, order_index: order_index ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ path: data }, { status: 201 });
}
