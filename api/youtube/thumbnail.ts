import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import { getGeminiClient, verifyAuth, getPrompt } from '../_shared';

export const config = { maxDuration: 60 };

const DEFAULT_PROMPT = `Create a YouTube thumbnail image.

REQUIREMENTS:
- Aspect ratio: 16:9 (standard YouTube thumbnail, 1280x720)
- Bold, readable text overlay with the key message
- High contrast colors that stand out in YouTube search results
- Professional quality, attention-grabbing design
- Use vibrant, saturated colors
- Large, clear visual elements (no tiny details)
- Do NOT include any small or hard-to-read text
- Make faces/expressions expressive if people are included
- The thumbnail should make someone WANT to click`;

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

  const { title, thumbnailIdea, channelName } = req.body;

  const basePrompt = await getPrompt('youtube-thumbnail', DEFAULT_PROMPT);

  const prompt = `${basePrompt}\n\nVideo title: "${title}"\nConcept: ${thumbnailIdea}${channelName ? `\nBrand: ${channelName}` : ''}`;

  try {
    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
      config: {
        imageConfig: { aspectRatio: '16:9', imageSize: '1K' },
        safetySettings: SAFETY,
      },
    });

    const candidates = response.candidates;
    if (candidates?.[0]?.content?.parts) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData?.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          return res.json({ image: `data:${mime};base64,${part.inlineData.data}` });
        }
      }
      for (const part of candidates[0].content.parts) {
        if (part.text) return res.status(422).json({ error: `Model refused: ${part.text}` });
      }
    }

    return res.status(500).json({ error: 'No thumbnail generated' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Thumbnail generation failed' });
  }
}
