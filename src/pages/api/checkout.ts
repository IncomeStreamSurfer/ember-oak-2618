import type { APIRoute } from 'astro';
import { stripe } from '../../lib/stripe';
import { getProductsByIds } from '../../lib/supabase';

export const prerender = false;

type IncomingItem = { id: string; quantity: number };

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as { items: IncomingItem[] };
    if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
      return json({ error: 'Cart is empty' }, 400);
    }

    const ids = [...new Set(body.items.map((i) => i.id))];
    const products = await getProductsByIds(ids);
    if (products.length === 0) {
      return json({ error: 'Products unavailable' }, 400);
    }

    const siteUrl = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;

    const line_items = body.items
      .map((inc) => {
        const p = products.find((x) => x.id === inc.id);
        if (!p) return null;
        const qty = Math.min(Math.max(1, Math.floor(inc.quantity)), 20);
        return {
          quantity: qty,
          price_data: {
            currency: p.currency || 'gbp',
            unit_amount: p.price_pence,
            product_data: {
              name: p.name,
              description: p.description || undefined,
              images: p.image_url ? [p.image_url] : undefined,
              metadata: { product_id: p.id, slug: p.slug },
            },
          },
        };
      })
      .filter(Boolean) as any[];

    if (line_items.length === 0) {
      return json({ error: 'No valid items' }, 400);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/cart`,
      shipping_address_collection: { allowed_countries: ['GB', 'US', 'IE', 'FR', 'DE', 'NL', 'ES', 'IT', 'CA'] },
      billing_address_collection: 'auto',
      phone_number_collection: { enabled: false },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 495, currency: 'gbp' },
            display_name: 'Standard UK (2-4 days)',
          },
        },
      ],
      metadata: {
        items_json: JSON.stringify(body.items),
      },
    });

    return json({ url: session.url });
  } catch (err: any) {
    console.error('[checkout] error:', err?.message || err);
    return json({ error: err?.message || 'Checkout failed' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
