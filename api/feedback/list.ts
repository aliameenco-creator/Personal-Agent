import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../_lib/auth';

/**
 * GET /api/feedback/list?system=youtube&limit=50 — list feedback (admin only).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Check admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const system = req.query.system as string | undefined;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);

    let query = supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (system) {
      query = query.eq('system', system);
    }

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ feedback: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
