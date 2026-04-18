import type { APIRoute } from 'astro';
import { getProducts } from '../lib/supabase';
import { supabase } from '../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ site, url }) => {
  const origin = import.meta.env.PUBLIC_SITE_URL || site?.toString() || url.origin;
  const base = origin.replace(/\/$/, '');

  const products = await getProducts();
  const { data: content } = await supabase
    .from('candle_content')
    .select('slug, published_at')
    .not('published_at', 'is', null);

  const staticUrls = ['/', '/about', '/cart', '/journal'];
  const productUrls = products.map((p) => `/products/${p.slug}`);
  const journalUrls = ((content as any[]) || []).map((c) => `/journal/${c.slug}`);

  const urls = [...staticUrls, ...productUrls, ...journalUrls].map(
    (p) => `<url><loc>${base}${p}</loc></url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
};
