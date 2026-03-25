import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// In-memory cache (per cold-start) with 5-minute TTL
const cache: Record<string, { text: string; ts: number }> = {};
const TTL = 5 * 60 * 1000;

/**
 * Fetches a system prompt by slug from Supabase.
 * Falls back to the provided default if not found in DB.
 */
export async function getPrompt(slug: string, fallback: string): Promise<string> {
  const cached = cache[slug];
  if (cached && Date.now() - cached.ts < TTL) return cached.text;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await supabase
      .from('system_prompts')
      .select('content')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    const text = data?.content || fallback;
    cache[slug] = { text, ts: Date.now() };
    return text;
  } catch {
    cache[slug] = { text: fallback, ts: Date.now() };
    return fallback;
  }
}
