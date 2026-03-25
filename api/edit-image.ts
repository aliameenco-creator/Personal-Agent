import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import { getGeminiClient, verifyAuth, getPrompt } from './_shared';

export const config = { maxDuration: 60 };

const DEFAULT_PROMPT = `You are a precise image editor. Apply the user's edit to this image.

RULES:
- ONLY change what the user specifically asks for. Everything else must remain pixel-perfect identical.
- Do NOT change any text, people, faces, or layout unless the user explicitly requests it.
- Make the minimum possible edit to fulfill the request.`;

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

  const { currentImage, userMessage, aspectRatio } = req.body;

  const systemPrompt = await getPrompt('edit-image', DEFAULT_PROMPT);

  const match = currentImage.match(/^data:(.+);base64,/);
  const mime = match ? match[1] : 'image/jpeg';
  const cleanData = currentImage.split(',')[1] || currentImage;

  const parts: any[] = [
    { inlineData: { data: cleanData, mimeType: mime } },
    { text: `${systemPrompt}\n\nUSER'S EDIT REQUEST: "${userMessage}"` },
  ];

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: aspectRatio || '1:1', imageSize: '1K' },
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
      for (const part of candidates[0].content.parts) {
        if (part.text) return res.status(422).json({ error: `Model refused: ${part.text}` });
      }
    }

    return res.status(500).json({ error: 'No image generated' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Edit failed' });
  }
}
