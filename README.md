# Ember & Oak 🕯️

Hand-poured candle shop. Six sample products, cart, Stripe checkout, Resend confirmations.

## Stack
- **Astro 5** (server output) on **Vercel**
- **Tailwind v4** via `@tailwindcss/vite`
- **Supabase** — products, orders, content (table prefix: `candle_`)
- **Stripe Checkout** (dynamic `price_data` from Supabase)
- **Resend** — order confirmation emails (from `onboarding@resend.dev`)

## What was built
- `/` — storefront grid with 6 candles, client-side cart
- `/products/[slug]` — product detail page with JSON-LD `Product` schema
- `/cart` — cart (localStorage) with quantity controls and Stripe checkout
- `/api/checkout` — creates a Stripe Checkout Session with dynamic line items from Supabase
- `/api/stripe/webhook` — handles `checkout.session.completed`, writes `candle_orders`, emails receipt via Resend
- `/success` — post-checkout thank-you page
- `/journal` + `/journal/[slug]` — Harbor content pipeline (reads `candle_content`)
- `/about` — studio story
- `/sitemap.xml` + `/robots.txt`

## Env vars (all set on Vercel)
```
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
STRIPE_SECRET_KEY
PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
PUBLIC_SITE_URL
```

## Next steps (manual)
1. **Custom domain** — add it in Vercel → Project → Domains and update `PUBLIC_SITE_URL`.
2. **Verify your Resend sending domain** so confirmations go from your domain rather than `onboarding@resend.dev`.
3. **Swap Stripe to live mode** when ready (replace `STRIPE_SECRET_KEY` + re-register the webhook).
4. **Customise the six candles** in the Supabase Table Editor → `candle_products`.
