import type { VercelRequest, VercelResponse } from '@vercel/node';
import { HarmCategory, HarmBlockThreshold } from '@google/genai';
import { getGeminiClient, verifyAuth, getPrompt } from './_shared';

export const config = { maxDuration: 60 };

const DEFAULT_PROMPT = `You are a precise image editor. Edit ONLY the branding elements in image 1. Everything else MUST remain pixel-perfect identical.

CRITICAL — TEXT PRESERVATION (DO NOT VIOLATE):
- Every single word, letter, and number in the image MUST remain EXACTLY as-is.
- Do NOT rephrase, rewrite, respell, reposition, or regenerate ANY text.
- Headlines, captions, body copy, dates, hashtags, URLs — keep them ALL character-for-character identical.
- Keep the exact same fonts, font sizes, font weights, and text positions.
- The ONLY text you may change is the brand name itself (if instructed below).

OTHER PRESERVATION RULES:
- Keep ALL people, faces, skin tones, expressions, and poses completely untouched.
- Keep the background, scenery, and all non-brand objects exactly as they are.
- Keep the overall layout, spacing, and composition identical.
- Keep all shadows, lighting, and depth of field identical.`;

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

  const { sourceImage, whiteLogo, blackLogo, instructions, brandName, aspectRatio } = req.body;

  const basePrompt = await getPrompt('rebrand', DEFAULT_PROMPT);

  const parts: any[] = [];
  addImagePart(parts, sourceImage);

  const hasWhiteLogo = !!whiteLogo;
  const hasBlackLogo = !!blackLogo;
  const hasBothLogos = hasWhiteLogo && hasBlackLogo;
  const hasAnyLogo = hasWhiteLogo || hasBlackLogo;
  const hasBrandName = !!brandName?.trim();

  if (hasWhiteLogo) addImagePart(parts, whiteLogo);
  if (hasBlackLogo) addImagePart(parts, blackLogo);

  let promptText = basePrompt + '\n\nBRANDING EDITS TO MAKE:';
  let editNum = 1;

  if (hasAnyLogo) {
    promptText += `\n${editNum}. LOGO REPLACEMENT:`;
    if (hasBothLogos) {
      promptText += `\n   I'm providing two logo variants:\n   - Image 2: WHITE logo (for dark backgrounds)\n   - Image 3: BLACK/dark logo (for light backgrounds)\n   Analyze the background and choose the best contrast variant.`;
    } else {
      promptText += `\n   Use the logo provided in image 2.`;
    }
    promptText += `\n   Place the logo in the EXACT same position, at the EXACT same size, and at the EXACT same angle as the original logo in image 1.`;
    editNum++;
  }

  if (hasBrandName) {
    promptText += `\n${editNum}. BRAND NAME: Find any existing brand name and replace it with "${brandName}". Use the same font style, size, and position.`;
    editNum++;
  }

  if (hasAnyLogo) {
    promptText += `\n${editNum}. COLOR ADAPTATION: Derive brand accent colors from the logo. Adapt to complement the image mood. Only apply to brand accent elements.`;
    editNum++;
  }

  if (!hasAnyLogo && !hasBrandName) {
    promptText += `\nNo specific branding edits requested. Return the image unchanged.`;
  }

  promptText += `\n\nOUTPUT REQUIREMENTS:\n- The result must look like a minimal, surgical edit — not a regenerated image.`;

  if (instructions) {
    promptText += `\n\nADDITIONAL USER INSTRUCTIONS: ${instructions}`;
  }

  parts.push({ text: promptText });

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
          const mime = part.inlineData.mimeType || 'image/png';
          return res.json({ image: `data:${mime};base64,${part.inlineData.data}` });
        }
      }
      for (const part of candidates[0].content.parts) {
        if (part.text) return res.status(422).json({ error: `Model refused: ${part.text}` });
      }
    }

    return res.status(500).json({ error: 'No image generated' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Rebrand failed' });
  }
}
