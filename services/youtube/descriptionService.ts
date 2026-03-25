import { AIProvider } from '../../types/ai-provider';
import { KeyPhrase } from '../../types/youtube';

interface GenerateDescriptionParams {
  title: string;
  topic: string;
  keyPhrases: KeyPhrase[];
  tone?: string;
  provider: AIProvider;
}

interface DescriptionResult {
  description: string;
  phraseVerification: { phrase: string; found: boolean }[];
}

/**
 * Verifies that all key phrases appear exactly (case-sensitive) in the description.
 */
export function verifyKeyPhrases(
  description: string,
  phrases: string[]
): { allPresent: boolean; results: { phrase: string; found: boolean }[] } {
  const results = phrases.map(phrase => ({
    phrase,
    found: description.includes(phrase),
  }));
  return {
    allPresent: results.every(r => r.found),
    results,
  };
}

/**
 * Generates a YouTube description with GUARANTEED exact key phrase insertion.
 *
 * Algorithm:
 * 1. Tell AI to write description with {{KP:N}} markers where phrases go
 * 2. Post-process: replace markers with exact phrase text
 * 3. Verify all phrases are present
 * 4. Surgically insert any missing phrases at sentence boundaries
 * 5. Last resort: append missing phrases at the end
 */
export async function generateDescription(params: GenerateDescriptionParams): Promise<DescriptionResult> {
  const { title, topic, keyPhrases, tone = 'professional', provider } = params;

  if (keyPhrases.length === 0) {
    // No key phrases — just generate a regular description
    const response = await provider.generateText({
      systemPrompt: `You are a YouTube SEO expert. Write a YouTube video description that looks like a REAL top creator's description.

STRUCTURE (follow this layout):
1. HOOK (first 157 chars) — a compelling 1-2 sentence summary that makes people want to watch
2. BODY (2-3 short paragraphs) — briefly explain what viewers will learn or experience. Keep it scannable.
3. TIMESTAMPS — include 5-8 realistic timestamps like:
   0:00 - Introduction
   1:23 - Topic name
   (make timestamps realistic for a 10-15 minute video)
4. RESOURCES — a "Resources & Links Mentioned" section with placeholder links like:
   🔗 [Tool/Resource Name] - https://example.com
5. CALL TO ACTION — a short section like:
   👍 If this helped, smash that like button and subscribe!
   🔔 Turn on notifications so you never miss a video!

RULES:
- Use line breaks generously — no big walls of text
- Use emojis sparingly for section headers (📌, 🔗, 👍, ⏰, etc.)
- Tone: ${tone}
- Do NOT include hashtags or tags (those go in a separate field)
- Return ONLY the description text, nothing else`,
      userPrompt: `Video title: "${title}"\nTopic: ${topic}`,
      temperature: 0.7,
    });

    return {
      description: response.text.trim(),
      phraseVerification: [],
    };
  }

  // Build the phrase list with markers
  const phraseList = keyPhrases.map((kp, i) => `  KP${i + 1}: "${kp.text}"`).join('\n');

  const response = await provider.generateText({
    systemPrompt: `You are a YouTube SEO expert. Write a YouTube video description that looks like a REAL top creator's description.

CRITICAL REQUIREMENT — KEY PHRASE INSERTION:
You MUST include ALL of the following exact phrases in your description.
Do NOT change, rephrase, reword, or modify ANY of these phrases — they must appear EXACTLY as written.

For each phrase, place the marker {{KP:N}} in your text exactly where that phrase should appear.
The marker will be replaced with the exact phrase text afterward.

Key phrases to include:
${phraseList}

Weave these phrases naturally into the hook, body paragraphs, and timestamp labels where possible.

STRUCTURE (follow this layout):
1. HOOK (first 157 chars) — a compelling 1-2 sentence summary that makes people want to watch. Try to include a key phrase here.
2. BODY (2-3 short paragraphs) — briefly explain what viewers will learn or experience. Weave key phrases naturally into these paragraphs. Keep it scannable.
3. TIMESTAMPS — include 5-8 realistic timestamps like:
   0:00 - Introduction
   1:23 - Topic name
   (make timestamps realistic for a 10-15 minute video, use key phrases in timestamp labels where they fit)
4. RESOURCES — a "Resources & Links Mentioned" section with placeholder links like:
   🔗 [Tool/Resource Name] - https://example.com
5. CALL TO ACTION — a short section like:
   👍 If this helped, smash that like button and subscribe!
   🔔 Turn on notifications so you never miss a video!

OTHER RULES:
- Use line breaks generously — no big walls of text
- Use emojis sparingly for section headers (📌, 🔗, 👍, ⏰, etc.)
- Tone: ${tone}
- Do NOT include hashtags or tags (those go in a separate field)
- Return ONLY the description text with markers, nothing else`,
    userPrompt: `Video title: "${title}"\nTopic: ${topic}`,
    temperature: 0.7,
  });

  let description = response.text.trim();

  // Step 1: Replace markers with exact phrases (handle all format variations)
  keyPhrases.forEach((kp, i) => {
    const n = i + 1;
    // Match {{KP:1}}, {{KP1}}, {{KP 1}}, {KP:1}, {KP1}, and case variations
    const markerPattern = new RegExp(`\\{\\{?\\s*KP[:\\s-]?${n}\\s*\\}\\}?`, 'gi');
    description = description.replace(markerPattern, kp.text);
  });

  // Step 2: Verify all phrases are present
  const verification = verifyKeyPhrases(
    description,
    keyPhrases.map(kp => kp.text)
  );

  // Step 3: Surgically insert any missing phrases
  const missingPhrases = verification.results.filter(r => !r.found).map(r => r.phrase);

  if (missingPhrases.length > 0) {
    // Split into sentences and insert missing phrases at evenly distributed points
    const sentences = description.split(/(?<=[.!?])\s+/);

    missingPhrases.forEach((phrase, i) => {
      const insertIndex = Math.min(
        Math.floor(sentences.length * ((i + 1) / (missingPhrases.length + 1))),
        sentences.length - 1
      );
      // Insert as a natural-looking sentence
      sentences.splice(insertIndex + 1, 0, phrase + '.');
    });

    description = sentences.join(' ');
  }

  // Step 4: Final verification
  const finalVerification = verifyKeyPhrases(
    description,
    keyPhrases.map(kp => kp.text)
  );

  // Step 5: Last resort — append any still-missing phrases
  const stillMissing = finalVerification.results.filter(r => !r.found);
  if (stillMissing.length > 0) {
    description += '\n\n' + stillMissing.map(r => r.phrase).join('. ') + '.';
  }

  // Rebuild verification after all insertions
  const completeVerification = verifyKeyPhrases(
    description,
    keyPhrases.map(kp => kp.text)
  );

  return {
    description,
    phraseVerification: completeVerification.results,
  };
}
