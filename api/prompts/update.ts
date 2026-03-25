import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth } from '../_lib/auth';

/**
 * POST /api/prompts/update — update a system prompt (admin only).
 * Body: { id, content, notes? }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const { id, content, notes } = req.body;

  if (!id || !content) {
    return res.status(400).json({ error: 'id and content are required' });
  }

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

    // Save current version to history before updating
    const { data: current } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (current) {
      await supabase.from('prompt_history').insert({
        prompt_id: id,
        slug: current.slug,
        content: current.content,
        updated_by: userId,
      });
    }

    // Update the prompt
    const { data, error } = await supabase
      .from('system_prompts')
      .update({
        content,
        notes: notes || null,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.json({ prompt: data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
