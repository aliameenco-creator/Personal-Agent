import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import { getGeminiClient, verifyAuth, getPrompt } from '../_shared.js';

export const config = { maxDuration: 60 };

const DEFAULT_PROMPT = `Create a professional LinkedIn post slide image.
DIMENSIONS: Portrait format, 1080x1350 pixels (3:4 aspect ratio)

DESIGN RULES:
- All text must be LARGE, READABLE, and CRISP — optimized for mobile viewing
- Professional, clean design suitable for LinkedIn
- Do NOT overcrowd the slide — whitespace is important
- Text must be perfectly spelled and match the content EXACTLY character-for-character
- Do NOT rephrase, rewrite, or modify any of the provided text
- Background should be clean and not distract from the text`;

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

function addImagePart(parts: any[], base64: string) {
  const match = base64.match(/^data:(.+);base64,/);
  const mime = match ? match[1] : 'image/jpeg';
  const cleanData = base64.split(',')[1] || base64;
  parts.push({ inlineData: { data: cleanData, mimeType: mime } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const userId = await verifyAuth(req, res);
  if (!userId) return;

  const { slideContent, brandKit, slideIndex, totalSlides, referenceImages } = req.body;
  const isFirstSlide = slideIndex === 0;
  const isLastSlide = slideIndex === totalSlides - 1;
  const isSinglePost = totalSlides === 1;

  const basePrompt = await getPrompt('linkedin-slide-image', DEFAULT_PROMPT);

  const parts: any[] = [];

  if (referenceImages?.length > 0) {
    for (const refImage of referenceImages) {
      addImagePart(parts, refImage);
    }
  }

  const logo = brandKit.whiteLogo || brandKit.blackLogo;
  if (logo) addImagePart(parts, logo);
  if (brandKit.profilePhoto) addImagePart(parts, brandKit.profilePhoto);

  let promptText = `${basePrompt}

BRAND IDENTITY:
- Brand: ${brandKit.brandName}
${brandKit.tagline ? `- Tagline: "${brandKit.tagline}"` : ''}
- Primary color: ${brandKit.colors.primary}
- Secondary color: ${brandKit.colors.secondary}
${brandKit.socialHandle ? `- Handle: ${brandKit.socialHandle}` : ''}
- Font style: ${brandKit.fontPreference}`;

  if (referenceImages?.length > 0) {
    promptText += `\n\nREFERENCE IMAGES: Match their visual style, layout density, and aesthetic closely.`;
  }
  if (logo) {
    promptText += `\n\nLOGO: Include the brand logo subtly in a corner or header area.`;
  }
  if (brandKit.profilePhoto) {
    promptText += `\n\nPROFILE PHOTO: ${isLastSlide || isSinglePost ? 'Include it near the CTA or brand name.' : 'Include if it fits naturally.'}`;
  }

  promptText += `\n\n${isSinglePost ? 'SINGLE IMAGE POST' : `SLIDE ${slideIndex + 1} OF ${totalSlides}`}:
- Headline: "${slideContent.headline}"
- Body text: "${slideContent.body}"
- Layout: ${slideContent.layoutSuggestion}
- Visual direction: ${slideContent.visualNotes}`;

  if (isFirstSlide && !isSinglePost) {
    promptText += `\n\nThis is the HOOK slide. Make it bold, attention-grabbing.`;
  } else if (isLastSlide && !isSinglePost) {
    promptText += `\n\nThis is the CTA slide. Include brand handle prominently.`;
  }

  promptText += `\n\n- Use primary color (${brandKit.colors.primary}) as dominant accent
- Use secondary color (${brandKit.colors.secondary}) for highlights`;

  parts.push({ text: promptText });

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
          const mime = part.inlineData.mimeType || 'image/png';
          return res.json({ image: `data:${mime};base64,${part.inlineData.data}` });
        }
      }
      for (const part of candidates[0].content.parts) {
        if (part.text) return res.status(422).json({ error: `Model refused: ${part.text}` });
      }
    }

    return res.status(500).json({ error: 'No slide image generated' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Slide generation failed' });
  }
}
