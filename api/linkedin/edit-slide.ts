import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import { getGeminiClient, verifyAuth } from '../_shared';

export const config = { maxDuration: 60 };

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const { currentImage, userMessage } = req.body;

  const match = currentImage.match(/^data:(.+);base64,/);
  const mime = match ? match[1] : 'image/jpeg';
  const cleanData = currentImage.split(',')[1] || currentImage;

  const parts: any[] = [
    { inlineData: { data: cleanData, mimeType: mime } },
    {
      text: `You are a precise image editor. Apply the user's edit to this LinkedIn post slide image.

RULES:
- ONLY change what the user specifically asks for. Everything else must remain pixel-perfect identical.
- Do NOT change any text, layout, or design unless the user explicitly requests it.
- Maintain the same 3:4 portrait aspect ratio.

USER'S EDIT REQUEST: "${userMessage}"`,
    },
  ];

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: '3:4', imageSize: '1K' },
        safetySettings: SAFETY,
      },
    });

    const candidates = response.candidates;
    if (candidates?.[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || 'image/png';
          return res.json({ image: `data:${outMime};base64,${part.inlineData.data}` });
        }
      }
    }

    return res.status(500).json({ error: 'Failed to edit slide image' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Slide edit failed' });
  }
}
