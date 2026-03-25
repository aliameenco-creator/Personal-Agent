import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient, verifyAuth } from '../_shared';

export const config = { maxDuration: 60 };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const { currentImage, editPrompt, attachments } = req.body;
  // currentImage: data URL string
  // attachments: { data: base64, mimeType: string }[]

  const base64Data = currentImage.split(',')[1];
  const mimeType = currentImage.match(/^data:(image\/\w+);/)?.[1] || 'image/png';

  const parts: any[] = [
    { inlineData: { data: base64Data, mimeType } },
    { text: 'This is the current YouTube thumbnail to edit.' },
  ];

  if (attachments?.length > 0) {
    for (const att of attachments) {
      parts.push({ inlineData: { data: att.data, mimeType: att.mimeType } });
      parts.push({ text: 'Use this attached image as a reference for the edit.' });
    }
  }

  parts.push({
    text: `Edit the thumbnail image above. Apply these changes and return the modified image:\n\n${editPrompt}\n\nYou MUST return the edited image. Keep the 16:9 aspect ratio. Only make the requested changes, keep everything else the same.`,
  });

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

    return res.status(500).json({ error: 'Failed to edit thumbnail' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Thumbnail edit failed' });
  }
}
