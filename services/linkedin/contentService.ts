import { LinkedInBrandKit, LinkedInPostType, SlideContent } from '../../types/linkedin';
import { apiPost } from '../apiClient';

interface ContentRequest {
  topic: string;
  postType: LinkedInPostType;
  slideCount: number;
  brandKit: LinkedInBrandKit;
  referenceImages?: string[];
}

const getMimeType = (base64: string): string => {
  const match = base64.match(/^data:(.+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export async function generateSlideContent(request: ContentRequest): Promise<SlideContent[]> {
  const systemPrompt = `You are a LinkedIn content strategist and carousel designer.
Given a topic, brand identity, and optional reference post style, generate slide-by-slide content for a LinkedIn ${request.postType === 'single' ? 'single image post' : 'carousel post'}.

For each slide, provide:
- headline: The main bold text (keep under 12 words)
- body: Supporting text or bullet points (keep under 40 words)
- layoutSuggestion: Brief layout direction
- visualNotes: Color/mood/visual direction notes

RULES:
${request.postType === 'carousel' ? `- Slide 1 is always a "hook" slide — attention-grabbing headline, minimal body
- Last slide is always a CTA slide with the brand handle "${request.brandKit.socialHandle || request.brandKit.brandName}"
- Middle slides deliver value, each with ONE clear idea` : `- Create one impactful slide with a strong headline and supporting text
- Include a subtle CTA or brand mention`}
- Use a professional, engaging LinkedIn tone
- Keep text concise
- Brand: ${request.brandKit.brandName}${request.brandKit.tagline ? `, Tagline: "${request.brandKit.tagline}"` : ''}

Generate exactly ${request.slideCount} slide(s).

IMPORTANT: Return ONLY valid JSON in this exact format, no other text:
{ "slides": [ { "headline": "...", "body": "...", "layoutSuggestion": "...", "visualNotes": "..." } ] }`;

  const userPrompt = `TOPIC: ${request.topic}`;

  const { text } = await apiPost('ai-text', {
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    promptSlug: 'linkedin-content',
    referenceImages: request.referenceImages,
  });

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse slide content from AI response.');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const slides: SlideContent[] = parsed.slides.map((s: any, i: number) => ({
    id: Math.random().toString(36).substr(2, 9),
    index: i,
    headline: s.headline || '',
    body: s.body || '',
    layoutSuggestion: s.layoutSuggestion || '',
    visualNotes: s.visualNotes || '',
  }));

  return slides;
}
