import { AIProvider } from '../../types/ai-provider';
import { TagGenerationRequest, TagGenerationResult } from '../../types/youtube';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'that', 'this', 'are', 'was',
  'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'can', 'shall', 'not', 'no',
  'you', 'your', 'we', 'our', 'they', 'their', 'my', 'his', 'her', 'its',
]);

const MAX_TAG_CHARS = 500;

function deduplicate(tags: string[]): string[] {
  const seen = new Set<string>();
  return tags.filter(tag => {
    const lower = tag.toLowerCase().trim();
    if (!lower || seen.has(lower)) return false;
    seen.add(lower);
    return true;
  });
}

function enforceTagLimits(tags: string[], maxChars: number): string[] {
  const result: string[] = [];
  let totalLength = 0;

  for (const tag of tags) {
    const tagLen = tag.length;
    // Account for commas between tags
    const addLen = totalLength === 0 ? tagLen : tagLen + 1;
    if (totalLength + addLen > maxChars) break;
    result.push(tag);
    totalLength += addLen;
  }

  return result;
}

function calculateCharCount(tags: string[]): number {
  return tags.join(',').length;
}

/**
 * Derive tags algorithmically from the title, description, and topic.
 */
function deriveTagsAlgorithmically(title: string, description: string, topic: string): string[] {
  const tags: string[] = [];

  // Original topic
  if (topic) tags.push(topic.toLowerCase());

  // Common YouTube search patterns
  const topicLower = topic.toLowerCase();
  const patterns = [
    `${topicLower} tutorial`,
    `${topicLower} explained`,
    `how to ${topicLower}`,
    `${topicLower} tips`,
    `${topicLower} for beginners`,
    `best ${topicLower}`,
    `${topicLower} 2026`,
    `${topicLower} guide`,
    `${topicLower} review`,
  ];
  tags.push(...patterns);

  // Extract meaningful words from title
  const titleWords = title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !STOP_WORDS.has(w));
  tags.push(...titleWords);

  // Extract 2-word combinations from title
  const words = title.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => !STOP_WORDS.has(w));
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 2 && words[i + 1].length > 2) {
      tags.push(`${words[i]} ${words[i + 1]}`);
    }
  }

  return tags;
}

/**
 * Generate tags using AI.
 */
async function generateAITags(request: TagGenerationRequest, provider: AIProvider): Promise<string[]> {
  const response = await provider.generateText({
    systemPrompt: `You are a YouTube SEO expert. Generate relevant YouTube tags for a video.

RULES:
- Generate 20-25 tags sorted by relevance (most relevant first)
- Mix of short-tail and long-tail keywords
- Include variations and related terms
- Each tag should be lowercase
- Return ONLY a JSON array of strings, nothing else

Example output: ["tag one", "tag two", "tag three"]`,
    userPrompt: `Video title: "${request.title}"
Topic: ${request.topic}
Description summary: ${request.description.substring(0, 300)}`,
    temperature: 0.6,
  });

  try {
    // Try to parse the response as JSON
    const text = response.text.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch {
    // Fall back to splitting by newlines/commas
    return response.text
      .replace(/[\[\]"]/g, '')
      .split(/[,\n]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }
}

/**
 * Generate tags using a hybrid AI + algorithmic approach.
 */
export async function generateTags(request: TagGenerationRequest, provider: AIProvider): Promise<TagGenerationResult> {
  const maxChars = request.maxTotalChars ?? MAX_TAG_CHARS;

  // 1. AI-generated tags
  let aiTags: string[] = [];
  try {
    aiTags = await generateAITags(request, provider);
  } catch {
    // If AI fails, fall back to algorithmic only
  }

  // 2. Algorithmic tags
  const algoTags = deriveTagsAlgorithmically(request.title, request.description, request.topic);

  // 3. Merge: AI tags first (higher quality), then algorithmic supplements
  const combined = deduplicate([...aiTags, ...algoTags]);

  // 4. Enforce YouTube's 500-character limit
  const finalTags = enforceTagLimits(combined, maxChars);

  return {
    tags: finalTags,
    totalCharCount: calculateCharCount(finalTags),
  };
}
