import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_lib/gemini';
import { verifyAuth } from './_lib/auth';
import { getPrompt } from './_lib/prompts';

export const config = { maxDuration: 30 };

/**
 * Generic text generation endpoint used by description, tags, and other text services.
 * Accepts: { systemPrompt, userPrompt, temperature?, maxTokens?, promptSlug? }
 * If promptSlug is provided, fetches prompt from DB (using systemPrompt as fallback).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const { systemPrompt, userPrompt, temperature = 0.7, maxTokens, promptSlug, referenceImages } = req.body;

  let finalSystemPrompt = systemPrompt;
  if (promptSlug) {
    finalSystemPrompt = await getPrompt(promptSlug, systemPrompt);
  }

  try {
    const ai = getGeminiClient();

    const parts: any[] = [];

    // Add reference images if provided (for LinkedIn content generation)
    if (referenceImages && referenceImages.length > 0) {
      for (const refImage of referenceImages) {
        const match = refImage.match(/^data:(.+);base64,/);
        const mime = match ? match[1] : 'image/jpeg';
        const cleanData = refImage.split(',')[1] || refImage;
        parts.push({ inlineData: { data: cleanData, mimeType: mime } });
      }
    }

    parts.push({ text: finalSystemPrompt + '\n\n' + userPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: { parts },
      config: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    });

    const text = response.text ?? '';
    return res.json({ text, model: 'gemini-2.0-flash' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Text generation failed' });
  }
}
