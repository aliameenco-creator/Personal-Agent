export interface LinkedInBrandKit {
  id: string;
  brandName: string;
  tagline: string;
  socialHandle: string;
  fontPreference: string;
  colors: {
    primary: string;
    secondary: string;
  };
  whiteLogo: string | null;
  blackLogo: string | null;
  profilePhoto: string | null;
  createdAt: number;
  updatedAt: number;
}

export type LinkedInPostType = 'single' | 'carousel';

export interface SlideContent {
  id: string;
  index: number;
  headline: string;
  body: string;
  layoutSuggestion: string;
  visualNotes: string;
}

export interface GeneratedSlide {
  id: string;
  index: number;
  content: SlideContent;
  imageDataUrl: string | null;
  status: 'pending' | 'generating' | 'completed' | 'error';
  errorMessage?: string;
}

export interface ReferencePost {
  images: string[];
  enabled: boolean;
}

export interface LinkedInProject {
  id: string;
  postType: LinkedInPostType;
  topic: string;
  referencePost: ReferencePost;
  slideCount: number;
  slideContents: SlideContent[];
  generatedSlides: GeneratedSlide[];
  currentPhase: LinkedInPhase;
}

export type LinkedInPhase = 'setup' | 'content' | 'generation' | 'download';
