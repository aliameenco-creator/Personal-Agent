import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Step 1: Basic function works
  const checks: Record<string, string> = { basic: 'ok' };

  // Step 2: Check env vars exist
  checks.GEMINI_API_KEY = process.env.GEMINI_API_KEY ? 'set' : 'MISSING';
  checks.SUPABASE_URL = process.env.SUPABASE_URL ? 'set' : 'MISSING';
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING';
  checks.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ? 'set' : 'MISSING';

  // Step 3: Test imports
  try {
    const { GoogleGenAI } = await import('@google/genai');
    checks.genai_import = 'ok';
    checks.genai_type = typeof GoogleGenAI;
  } catch (e: any) {
    checks.genai_import = `FAILED: ${e.message}`;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    checks.supabase_import = 'ok';
    checks.supabase_type = typeof createClient;
  } catch (e: any) {
    checks.supabase_import = `FAILED: ${e.message}`;
  }

  // Step 4: Test _shared import
  try {
    const shared = await import('./_shared');
    checks.shared_import = 'ok';
    checks.shared_exports = Object.keys(shared).join(', ');
  } catch (e: any) {
    checks.shared_import = `FAILED: ${e.message}`;
  }

  return res.json(checks);
}
