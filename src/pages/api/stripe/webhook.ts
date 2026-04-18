import type { APIRoute } from 'astro';
import { stripe } from '../../../lib/stripe';
import { supabase } from '../../../lib/supabase';
import { sendOrderConfirmation } from '../../../lib/email';
import type Stripe from 'stripe';

export const prerender = false;

const WEBHOOK_SECRET = import.meta.env.STRIPE_WEBHOOK_SECRET as string;

export const POST: APIRoute = async ({ request }) => {
  const sig = request.headers.get('stripe-signature');
  if (!sig || !WEBHOOK_SECRET) {
    return new Response(JSON.stringify({ error: 'Missing signature or webhook secret' }), { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('[webhook] signature verification failed:', err?.message);
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Fetch line items (price_data becomes line_items.data on Session retrieve)
    let items: { name: string; quantity: number; amount_total: number }[] = [];
    try {
      const full = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ['line_items', 'line_items.data.price.product'],
      });
      items = (full.line_items?.data || []).map((li) => ({
        name: (li.description || (li.price?.product as any)?.name || 'Candle') as string,
        quantity: li.quantity || 1,
        amount_total: li.amount_total || 0,
      }));
    } catch (err) {
      console.error('[webhook] retrieve line items failed:', err);
    }

    const orderRow = {
      stripe_session_id: session.id,
      customer_email: session.customer_details?.email || session.customer_email || null,
      customer_name: session.customer_details?.name || null,
      amount_total_pence: session.amount_total || 0,
      currency: session.currency || 'gbp',
      line_items: items,
      status: 'paid',
    };

    const { error: insErr } = await supabase.from('candle_orders').insert(orderRow as any);
    if (insErr) console.error('[webhook] insert order error:', insErr.message);

    if (orderRow.customer_email) {
      await sendOrderConfirmation({
        to: orderRow.customer_email,
        customerName: orderRow.customer_name,
        orderId: session.id.slice(-10).toUpperCase(),
        totalPence: orderRow.amount_total_pence,
        currency: orderRow.currency,
        items,
      });
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
};
