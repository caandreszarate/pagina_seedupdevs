import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionByEmail } from '@/lib/subscription';

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email') ?? '';
  if (!email) return NextResponse.json({ subscription: null });

  const sub = await getSubscriptionByEmail(email);
  if (!sub) return NextResponse.json({ subscription: null });

  return NextResponse.json({
    subscription: {
      plan: sub.plan,
      status: sub.status,
      current_period_end: sub.current_period_end,
    },
  });
}
