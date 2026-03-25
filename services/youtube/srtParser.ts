import { SRTScene } from '../../types/youtube';

/**
 * Parse SRT timestamp to seconds.
 * Format: HH:MM:SS,mmm
 */
function parseTimestamp(ts: string): number {
  const parts = ts.trim().replace(',', '.').split(':');
  if (parts.length !== 3) return 0;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseFloat(parts[2]);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Parse SRT text into an array of scenes.
 *
 * SRT format:
 * ```
 * 1
 * 00:00:00,000 --> 00:00:04,000
 * First subtitle line
 *
 * 2
 * 00:00:04,000 --> 00:00:08,000
 * Second subtitle line
 * ```
 */
export function parseSRT(srtText: string): SRTScene[] {
  const blocks = srtText.trim().split(/\n\s*\n/);
  const scenes: SRTScene[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;

    // Line 1: sequence number (skip)
    // Line 2: timestamps
    const timestampLine = lines[1];
    const timestampMatch = timestampLine.match(
      /(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/
    );

    if (!timestampMatch) continue;

    const start = parseTimestamp(timestampMatch[1]);
    const end = parseTimestamp(timestampMatch[2]);

    // Lines 3+: subtitle text (may span multiple lines)
    const text = lines.slice(2).join(' ').trim();

    if (text) {
      scenes.push({
        id: Math.random().toString(36).substr(2, 9),
        index: scenes.length,
        start,
        end,
        text,
        status: 'pending',
      });
    }
  }

  return scenes;
}

/**
 * Merge small consecutive scenes that together fit within maxDuration.
 * Veo 3.1 supports 4-8 second clips, so we want segments in that range.
 */
export function mergeShortScenes(scenes: SRTScene[], maxDuration: number = 8): SRTScene[] {
  if (scenes.length === 0) return [];

  const merged: SRTScene[] = [];
  let current = { ...scenes[0] };

  for (let i = 1; i < scenes.length; i++) {
    const next = scenes[i];
    const combinedDuration = next.end - current.start;

    if (combinedDuration <= maxDuration) {
      // Merge: combine text, extend end time
      current = {
        ...current,
        end: next.end,
        text: current.text + ' ' + next.text,
      };
    } else {
      merged.push(current);
      current = { ...next };
    }
  }
  merged.push(current);

  // Re-index
  return merged.map((s, i) => ({ ...s, index: i, id: Math.random().toString(36).substr(2, 9) }));
}

/**
 * Split scenes that are longer than maxDuration into sub-scenes.
 */
export function splitLongScenes(scenes: SRTScene[], maxDuration: number = 8): SRTScene[] {
  const result: SRTScene[] = [];

  for (const scene of scenes) {
    const duration = scene.end - scene.start;

    if (duration <= maxDuration) {
      result.push(scene);
    } else {
      // Split into chunks of maxDuration
      const chunks = Math.ceil(duration / maxDuration);
      const words = scene.text.split(' ');
      const wordsPerChunk = Math.ceil(words.length / chunks);

      for (let i = 0; i < chunks; i++) {
        const chunkStart = scene.start + i * (duration / chunks);
        const chunkEnd = Math.min(scene.start + (i + 1) * (duration / chunks), scene.end);
        const chunkWords = words.slice(i * wordsPerChunk, (i + 1) * wordsPerChunk);

        result.push({
          id: Math.random().toString(36).substr(2, 9),
          index: result.length,
          start: chunkStart,
          end: chunkEnd,
          text: chunkWords.join(' '),
          status: 'pending',
        });
      }
    }
  }

  return result.map((s, i) => ({ ...s, index: i }));
}

/**
 * Full SRT processing pipeline: parse → split long → merge short.
 * Returns scenes optimized for Veo 3.1's 4-8 second clip range.
 */
export function processSRT(srtText: string): SRTScene[] {
  const parsed = parseSRT(srtText);
  const split = splitLongScenes(parsed, 8);
  const merged = mergeShortScenes(split, 8);
  return merged;
}
