import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// --- Gemini Client ---
let _client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');
    _client = new GoogleGenAI({ apiKey: key });
  }
  return _client;
}

// --- Auth ---
export async function verifyAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Missing authorization token' });
    return null;
  }

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }

  return user.id;
}

// --- Prompts ---
const cache: Record<string, { text: string; ts: number }> = {};
const TTL = 5 * 60 * 1000;

export async function getPrompt(slug: string, fallback: string): Promise<string> {
  const cached = cache[slug];
  if (cached && Date.now() - cached.ts < TTL) return cached.text;

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
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
