import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserByEmail } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const { email, lesson_id, progress_percentage } = await req.json() as {
    email: string;
    lesson_id: string;
    progress_percentage: number;
  };

  if (!email || !lesson_id) {
    return NextResponse.json({ error: 'email y lesson_id requeridos' }, { status: 400 });
  }

  const user = await getUserByEmail(email);
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  const pct = Math.min(100, Math.max(0, progress_percentage));
  const completed = pct === 100;
  const completedAt = completed ? new Date().toISOString() : null;

  const { error } = await supabaseAdmin.from('user_progress').upsert(
    {
      user_id: user.id,
      lesson_id,
      progress_percentage: pct,
      completed,
      ...(completedAt ? { completed_at: completedAt } : {}),
    },
    { onConflict: 'user_id,lesson_id' },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, completed });
}
