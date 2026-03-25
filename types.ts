export interface BrandAssets {
  whiteLogo: string | null;
  blackLogo: string | null;
  brandName: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text?: string;
  image?: string;
  timestamp: number;
}

export interface RebrandRequest {
  sourceImage: string;
  whiteLogo?: string;
  blackLogo?: string;
  brandName?: string;
  instructions?: string;
}

export interface EditRequest {
  currentImage: string;
  userMessage: string;
}

export interface RebrandJob {
  id: string;
  sourceImage: string;
  resultImage: string | null;
  status: 'idle' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
  fileName: string;
  chatHistory: ChatMessage[];
}