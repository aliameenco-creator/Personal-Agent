import { AIProvider, AITextRequest, AITextResponse } from '../../types/ai-provider';

export class OpenAITextProvider implements AIProvider {
  name = 'openai';

  async generateText(_request: AITextRequest): Promise<AITextResponse> {
    // Stub: OpenAI integration will be added when API key is configured.
    // Install the openai package and add OPENAI_API_KEY to .env.local when ready.
    throw new Error(
      'OpenAI provider is not yet configured. Please add your OpenAI API key and install the openai package.'
    );
  }
}
