import { AIProvider } from '../../types/ai-provider';
import { GeminiTextProvider } from './geminiTextProvider';
import { OpenAITextProvider } from './openaiTextProvider';

export type ProviderName = 'gemini' | 'openai';

const providers: Record<ProviderName, () => AIProvider> = {
  gemini: () => new GeminiTextProvider(),
  openai: () => new OpenAITextProvider(),
};

export function getProvider(name: ProviderName = 'gemini'): AIProvider {
  const factory = providers[name];
  if (!factory) {
    throw new Error(`Unknown AI provider: ${name}`);
  }
  return factory();
}
