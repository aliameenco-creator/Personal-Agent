import { AIProvider, AITextRequest, AITextResponse, AIImageRequest, AIImageResponse } from '../../types/ai-provider';
import { stripImageMetadata } from '../../utils/stripMetadata';
import { apiPost } from '../apiClient';

export class GeminiTextProvider implements AIProvider {
  name = 'gemini';

  async generateText(request: AITextRequest): Promise<AITextResponse> {
    const { text, model } = await apiPost('ai-text', {
      systemPrompt: request.systemPrompt,
      userPrompt: request.userPrompt,
      temperature: request.temperature ?? 0.7,
      maxTokens: request.maxTokens,
    });

    return { text, model };
  }

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    // Image generation goes through youtube/thumbnail endpoint
    const { image } = await apiPost('youtube/thumbnail', {
      title: '',
      thumbnailIdea: request.prompt,
    });

    const stripped = await stripImageMetadata(image);
    return { images: [stripped], model: 'gemini-3-pro-image-preview' };
  }
}
