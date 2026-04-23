import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const pathId = req.nextUrl.searchParams.get('path_id') ?? '';
  if (!pathId) return NextResponse.json({ error: 'path_id requerido' }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from('modules')
    .select('id, title, description, order_index, lessons(id, title, is_premium, duration_minutes, order_index)')
    .eq('learning_path_id', pathId)
    .order('order_index');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ modules: data });
}
