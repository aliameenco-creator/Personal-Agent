import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../_shared.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // POST — submit feedback
  if (req.method === 'POST') {
    const { system, rating, comment, metadata } = req.body;

    if (!system || !rating) {
      return res.status(400).json({ error: 'system and rating are required' });
    }

    try {
      const { error } = await supabase.from('feedback').insert({
        user_id: userId,
        system,
        rating,
        comment: comment || null,
        metadata: metadata || {},
      });

      if (error) throw error;
      return res.json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to submit feedback' });
    }
  }

  // GET — list feedback (admin only)
  if (req.method === 'GET') {
    try {
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

      if (system) query = query.eq('system', system);

      const { data, error } = await query;
      if (error) throw error;

      return res.json({ feedback: data });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
