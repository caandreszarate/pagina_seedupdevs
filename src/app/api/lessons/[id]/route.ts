import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isPro, getUserByEmail } from '@/lib/subscription';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = req.nextUrl.searchParams.get('email') ?? '';

  const { data: lesson, error } = await supabaseAdmin
    .from('lessons')
    .select('id, title, content, is_premium, duration_minutes, module_id')
    .eq('id', id)
    .single();

  if (error || !lesson) return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 });

  if (lesson.is_premium) {
    const pro = email ? await isPro(email) : false;
    if (!pro) {
      return NextResponse.json({ paywalled: true, lesson: { id: lesson.id, title: lesson.title, is_premium: true } });
    }
  }

  if (email) {
    const user = await getUserByEmail(email);
    if (user) {
      await supabaseAdmin.from('lesson_access_logs').insert({ user_id: user.id, lesson_id: id });
    }
  }

  return NextResponse.json({ paywalled: false, lesson });
}
