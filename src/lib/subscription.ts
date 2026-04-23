import { supabaseAdmin } from './supabase';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: 'free' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  current_period_end: string | null;
  created_at: string;
}

export async function getUserByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();
  return data;
}

export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  const { data } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  return data as Subscription | null;
}

export async function getSubscriptionByEmail(email: string): Promise<Subscription | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  return getSubscriptionByUserId(user.id);
}

export async function isPro(email: string): Promise<boolean> {
  const sub = await getSubscriptionByEmail(email);
  return sub?.plan === 'pro' && sub?.status === 'active';
}

export async function getOrCreateStripeCustomer(
  stripe: import('stripe').default,
  userId: string,
  email: string,
): Promise<string> {
  const existing = await getSubscriptionByUserId(userId);
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({ email });

  await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    stripe_customer_id: customer.id,
    plan: 'free',
    status: 'active',
  }, { onConflict: 'user_id' });

  return customer.id;
}
