import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient, verifyAuth, getPrompt } from '../_shared.js';

export const config = { maxDuration: 60 };

const DEFAULT_PROMPT = `Create a high-quality YouTube thumbnail (16:9 aspect ratio).
Ensure the text is legible if any is requested.
Make it eye-catching, high contrast, and suitable for a small screen.`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const { prompt, userImage, referenceImages } = req.body;
  // userImage: { data: base64, mimeType: string } | null
  // referenceImages: { data: base64, mimeType: string }[]

  const basePrompt = await getPrompt('thumbnail-generator', DEFAULT_PROMPT);

  const parts: any[] = [];

  if (userImage) {
    parts.push({ inlineData: { data: userImage.data, mimeType: userImage.mimeType } });
    parts.push({ text: 'This is the main subject/person for the thumbnail.' });
  }

  if (referenceImages?.length > 0) {
    for (const ref of referenceImages) {
      parts.push({ inlineData: { data: ref.data, mimeType: ref.mimeType } });
      parts.push({ text: 'Use this image as a style or composition reference.' });
    }
  }

  parts.push({ text: `${basePrompt}\n\nInstructions:\n${prompt}` });

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: '16:9', imageSize: '1K' },
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return res.json({ image: `data:${mime};base64,${part.inlineData.data}` });
        }
      }
    }

    return res.status(500).json({ error: 'No thumbnail generated' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Thumbnail generation failed' });
  }
}
