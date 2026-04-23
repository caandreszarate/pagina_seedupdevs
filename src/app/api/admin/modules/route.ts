import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminByEmail } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  const pathId = req.nextUrl.searchParams.get('path_id') ?? '';

  if (!await verifyAdminByEmail(email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  let query = supabaseAdmin.from('modules').select('*, lessons(count)').order('order_index');
  if (pathId) query = query.eq('learning_path_id', pathId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ modules: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, learning_path_id, title, description, order_index } = body;

  if (!await verifyAdminByEmail(email)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  if (!learning_path_id || !title) {
    return NextResponse.json({ error: 'learning_path_id y title requeridos' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('modules')
    .insert({ learning_path_id, title, description: description ?? '', order_index: order_index ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ module: data }, { status: 201 });
}
