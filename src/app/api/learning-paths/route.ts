import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get('level') ?? '';

  let query = supabaseAdmin
    .from('learning_paths')
    .select('id, name, description, level, is_premium, order_index, modules(id, title, order_index, lessons(id, is_premium, duration_minutes))')
    .order('order_index');

  if (level) query = query.eq('level', level);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ paths: data });
}
