import Stripe from 'stripe';

const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY as string;

export const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-12-18.acacia' as any,
  typescript: true,
});

export function formatPrice(pence: number, currency = 'gbp'): string {
  const symbols: Record<string, string> = { gbp: '£', usd: '$', eur: '€' };
  const symbol = symbols[currency.toLowerCase()] || '';
  return symbol + (pence / 100).toFixed(2);
}
