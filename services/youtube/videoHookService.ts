import { GoogleGenAI } from '@google/genai';
import { getProvider } from '../ai/providerFactory';

type VeoModel = 'standard' | 'fast';

const VEO_MODELS: Record<VeoModel, string> = {
  standard: 'veo-3.1-generate-preview',
  fast: 'veo-3.1-fast-generate-preview',
};

const GENAI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/**
 * Generate a motion graphics prompt for a single SRT scene using Gemini text.
 */
export async function generateScenePrompt(
  sceneText: string,
  overallContext: string,
  adjacentScenes?: { prev?: string; next?: string }
): Promise<string> {
  const provider = getProvider('gemini');

  const contextParts = [];
  if (adjacentScenes?.prev) contextParts.push(`Previous scene shows: ${adjacentScenes.prev}`);
  if (adjacentScenes?.next) contextParts.push(`Next scene will show: ${adjacentScenes.next}`);
  const continuityHint = contextParts.length > 0 ? `\n\nVISUAL CONTINUITY:\n${contextParts.join('\n')}` : '';

  const response = await provider.generateText({
    systemPrompt: `You are a motion graphics director. Given a script line from a YouTube video intro, describe what the background motion graphics should look like.

RULES:
- NO people, faces, talking heads, or voiceover visuals
- Focus on abstract motion graphics, animated infographics, kinetic typography concepts, particle effects, smooth transitions
- The visuals should be RELEVANT to what the speaker is saying
- Use cinematic, professional style
- Describe colors, movement, camera angles, and mood
- Keep the description to 2-3 sentences max
- The style should be modern, sleek, and engaging
- Return ONLY the visual description, nothing else${continuityHint}`,
    userPrompt: `Overall video context: ${overallContext}\n\nScript line: "${sceneText}"`,
    temperature: 0.7,
  });

  return response.text.trim();
}

/**
 * Build a download URL for a Google GenAI file.
 * The file name is like "files/abc123" — we need:
 *   GET https://generativelanguage.googleapis.com/v1beta/files/abc123?alt=media&key=API_KEY
 *
 * Without alt=media, Google returns JSON metadata instead of the actual file!
 */
function buildDownloadUrl(videoObj: any): string {
  const apiKey = process.env.API_KEY;

  // Case 1: video has a .uri that's already a full URL
  if (videoObj.uri && typeof videoObj.uri === 'string') {
    const url = new URL(videoObj.uri);
    url.searchParams.set('alt', 'media');
    if (!url.searchParams.has('key')) {
      url.searchParams.set('key', apiKey!);
    }
    console.log('[Veo] Download URL from .uri:', url.toString());
    return url.toString();
  }

  // Case 2: video has a .name like "files/abc123"
  if (videoObj.name && typeof videoObj.name === 'string') {
    const name = videoObj.name.startsWith('files/') ? videoObj.name : `files/${videoObj.name}`;
    const url = `${GENAI_BASE}/${name}?alt=media&key=${apiKey}`;
    console.log('[Veo] Download URL from .name:', url);
    return url;
  }

  // Case 3: video itself is a string (URI or name)
  if (typeof videoObj === 'string') {
    if (videoObj.startsWith('http')) {
      const url = new URL(videoObj);
      url.searchParams.set('alt', 'media');
      if (!url.searchParams.has('key')) {
        url.searchParams.set('key', apiKey!);
      }
      return url.toString();
    }
    const name = videoObj.startsWith('files/') ? videoObj : `files/${videoObj}`;
    return `${GENAI_BASE}/${name}?alt=media&key=${apiKey}`;
  }

  throw new Error('Cannot determine download URL. Video object: ' + JSON.stringify(videoObj));
}

/**
 * Generate a video clip for a single scene using Veo 3.1.
 * Returns a blob URL that can be used for preview and download.
 */
export async function generateVideoClip(
  prompt: string,
  durationSeconds: number,
  model: VeoModel = 'fast',
  onProgress?: (status: string) => void
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Clamp duration to Veo's supported range (must be a number)
  let veoDuration: number;
  if (durationSeconds <= 4) veoDuration = 4;
  else if (durationSeconds <= 6) veoDuration = 6;
  else veoDuration = 8;

  const fullPrompt = `${prompt}\n\nIMPORTANT: This is a BACKGROUND motion graphics clip. No people, no faces, no talking heads. Cinematic, professional quality. Smooth motion and transitions.`;

  onProgress?.('Starting video generation...');

  let operation = await ai.models.generateVideos({
    model: VEO_MODELS[model],
    prompt: fullPrompt,
    config: {
      aspectRatio: '16:9',
      durationSeconds: veoDuration,
      numberOfVideos: 1,
      negativePrompt: 'people speaking, voiceover, talking head, face, mouth moving, person, human',
    },
  });

  // Poll until done
  let pollCount = 0;
  while (!operation.done) {
    pollCount++;
    onProgress?.(`Generating video... (${pollCount * 10}s elapsed)`);
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation });
  }

  // Log the full response for debugging
  console.log('[Veo] Full operation:', operation);
  console.log('[Veo] operation.done:', operation.done);
  console.log('[Veo] operation.response:', (operation as any).response);

  // Extract the video
  const response = (operation as any).response;
  if (!response) {
    throw new Error('[Veo] operation.response is undefined. Full operation: ' + JSON.stringify(operation));
  }

  const generatedVideos = response.generatedVideos;
  if (!generatedVideos || generatedVideos.length === 0) {
    throw new Error('[Veo] No generatedVideos in response. Response: ' + JSON.stringify(response));
  }

  console.log('[Veo] generatedVideos[0]:', generatedVideos[0]);
  console.log('[Veo] generatedVideos[0].video:', generatedVideos[0].video);

  const videoObj = generatedVideos[0].video;
  if (!videoObj) {
    throw new Error('[Veo] video object is null. generatedVideos[0]: ' + JSON.stringify(generatedVideos[0]));
  }

  // Log all properties of the video object
  console.log('[Veo] Video object type:', typeof videoObj);
  if (typeof videoObj === 'object') {
    console.log('[Veo] Video object keys:', Object.keys(videoObj));
    console.log('[Veo] Video .uri:', videoObj.uri);
    console.log('[Veo] Video .name:', videoObj.name);
    console.log('[Veo] Video .mimeType:', videoObj.mimeType);
    console.log('[Veo] Video .sizeBytes:', videoObj.sizeBytes);
    console.log('[Veo] Video .state:', videoObj.state);
  }

  // Build the correct download URL with alt=media
  const downloadUrl = buildDownloadUrl(videoObj);

  onProgress?.('Downloading video...');

  // Fetch the actual video binary
  const videoResponse = await fetch(downloadUrl);
  console.log('[Veo] Download response status:', videoResponse.status);
  console.log('[Veo] Download response content-type:', videoResponse.headers.get('content-type'));
  console.log('[Veo] Download response content-length:', videoResponse.headers.get('content-length'));

  if (!videoResponse.ok) {
    const errorText = await videoResponse.text();
    throw new Error(`[Veo] Download failed: ${videoResponse.status} ${videoResponse.statusText}. Body: ${errorText}`);
  }

  const contentType = videoResponse.headers.get('content-type') || '';

  // Check if we accidentally got JSON metadata instead of video
  if (contentType.includes('application/json')) {
    const jsonBody = await videoResponse.text();
    console.error('[Veo] Got JSON instead of video! Body:', jsonBody);
    throw new Error('[Veo] Received JSON metadata instead of video data. The alt=media parameter may not be working. Response: ' + jsonBody);
  }

  const videoBlob = await videoResponse.blob();
  console.log('[Veo] Downloaded blob size:', videoBlob.size, 'type:', videoBlob.type);

  if (videoBlob.size === 0) {
    throw new Error('[Veo] Downloaded video is 0 bytes. URL used: ' + downloadUrl);
  }

  const blobUrl = URL.createObjectURL(videoBlob);
  return blobUrl;
}

/**
 * Download a generated video clip to the user's device.
 */
export async function downloadVideoClip(blobUrl: string, fileName: string): Promise<void> {
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
