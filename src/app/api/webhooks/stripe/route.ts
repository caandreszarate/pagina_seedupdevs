import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(sub);
        break;
      }
    }
  } catch (err) {
    console.error('[stripe-webhook]', event.type, err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription' || !session.subscription) return;

  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(session.subscription as string);
  await syncSubscription(sub);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string | undefined;
  if (!customerId) return;
  const stripe = getStripe();
  const subs = await stripe.subscriptions.list({ customer: customerId, limit: 1, status: 'active' });
  if (subs.data.length > 0) await syncSubscription(subs.data[0]);
}

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  const status = sub.status === 'active' ? 'active'
    : sub.status === 'canceled' ? 'canceled'
    : 'past_due';
  const plan = status === 'active' ? 'pro' : 'free';
  // current_period_end moved in Stripe API 2026-03-25.dahlia — access via type cast
  const rawPeriodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  const periodEnd = rawPeriodEnd ? new Date(rawPeriodEnd * 1000).toISOString() : null;

  await supabaseAdmin.from('subscriptions').upsert({
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    plan,
    status,
    current_period_end: periodEnd,
  }, { onConflict: 'stripe_customer_id' });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await supabaseAdmin
    .from('subscriptions')
    .update({ plan: 'free', status: 'canceled', stripe_subscription_id: null })
    .eq('stripe_subscription_id', sub.id);
}
