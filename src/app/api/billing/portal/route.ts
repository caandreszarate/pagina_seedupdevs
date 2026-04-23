import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getSubscriptionByEmail } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string };
    if (!email) return NextResponse.json({ error: 'email requerido' }, { status: 400 });

    const sub = await getSubscriptionByEmail(email);
    if (!sub?.stripe_customer_id) {
      return NextResponse.json({ error: 'No tienes suscripción activa' }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${siteUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[billing/portal]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
