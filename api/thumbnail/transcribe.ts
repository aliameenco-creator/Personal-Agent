import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from '../_lib/gemini';
import { verifyAuth } from '../_lib/auth';

export const config = { maxDuration: 30 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const { audioData, mimeType } = req.body;
  // audioData: base64 string (no data: prefix)
  // mimeType: e.g., 'audio/wav'

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: mimeType || 'audio/wav', data: audioData } },
          { text: 'Transcribe this audio exactly as spoken. Do not add any commentary.' },
        ],
      },
    });

    return res.json({ text: response.text || '' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Transcription failed' });
  }
}
