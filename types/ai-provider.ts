export interface AITextRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AITextResponse {
  text: string;
  tokensUsed?: number;
  model: string;
}

export interface AIImageRequest {
  prompt: string;
  referenceImages?: string[];
  aspectRatio?: string;
  size?: string;
}

export interface AIImageResponse {
  images: string[];
  model: string;
}

export interface AIProvider {
  name: string;
  generateText(request: AITextRequest): Promise<AITextResponse>;
  generateImage?(request: AIImageRequest): Promise<AIImageResponse>;
}
