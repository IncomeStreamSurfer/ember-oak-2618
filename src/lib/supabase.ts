import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[supabase] Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY envs');
}

export const supabase = createClient(SUPABASE_URL || 'https://placeholder.supabase.co', SUPABASE_ANON_KEY || 'placeholder');

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_pence: number;
  currency: string;
  image_url: string | null;
  scent_notes: string | null;
  burn_time_hours: number | null;
  weight_grams: number | null;
  stock: number;
  active: boolean;
  created_at: string;
};

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('candle_products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[supabase] getProducts error:', error.message);
    return [];
  }
  return (data || []) as Product[];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from('candle_products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (error) {
    console.error('[supabase] getProductBySlug error:', error.message);
    return null;
  }
  return (data as Product) || null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from('candle_products')
    .select('*')
    .in('id', ids)
    .eq('active', true);
  if (error) {
    console.error('[supabase] getProductsByIds error:', error.message);
    return [];
  }
  return (data || []) as Product[];
}
