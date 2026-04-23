import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getUserByEmail, getOrCreateStripeCustomer } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  try {
    const { email, plan } = await req.json() as { email: string; plan: 'monthly' | 'yearly' };

    if (!email || !plan) {
      return NextResponse.json({ error: 'email y plan requeridos' }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado. Completa una evaluación primero.' }, { status: 404 });
    }

    const stripe = getStripe();
    const customerId = await getOrCreateStripeCustomer(stripe, user.id, email);

    const priceId = plan === 'monthly'
      ? process.env.STRIPE_PRICE_ID_PRO_MONTHLY
      : process.env.STRIPE_PRICE_ID_PRO_YEARLY;

    if (!priceId) {
      return NextResponse.json({ error: 'Plan no configurado' }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/billing?checkout=success`,
      cancel_url: `${siteUrl}/pricing?checkout=cancel`,
      metadata: { user_id: user.id, email },
      subscription_data: { metadata: { user_id: user.id } },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
