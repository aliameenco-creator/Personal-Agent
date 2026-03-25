import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const { system, rating, comment, metadata } = req.body;
  // system: 'rebrand' | 'youtube' | 'linkedin' | 'thumbnail'
  // rating: 1-5
  // comment: string (optional)
  // metadata: object (optional) - e.g., { promptSlug, inputSummary }

  if (!system || !rating) {
    return res.status(400).json({ error: 'system and rating are required' });
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

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
