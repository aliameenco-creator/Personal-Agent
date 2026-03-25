// === Brand Profiles (multi-account support) ===

export interface BrandProfile {
  id: string;
  name: string;
  channelName: string;
  channelUrl?: string;
  defaultTone: string;
  defaultLanguage: string;
  signoffText?: string;
  socialLinks?: SocialLink[];
  createdAt: number;
  updatedAt: number;
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

// === Key Phrases ===

export interface KeyPhrase {
  id: string;
  text: string;       // Exact text from vidIQ — NEVER mutate
  used: boolean;
  source: 'vidiq' | 'manual';
}

// === YouTube Content Pipeline ===

export type WorkflowStep = 'title' | 'description' | 'tags' | 'thumbnail' | 'hook';

export interface SRTScene {
  id: string;
  index: number;
  start: number;       // seconds
  end: number;         // seconds
  text: string;        // script line
  prompt?: string;     // generated motion graphics prompt
  videoUrl?: string;   // download URL from Veo
  status: 'pending' | 'generating-prompt' | 'generating-video' | 'polling' | 'completed' | 'error';
  errorMessage?: string;
}

export interface YouTubeProject {
  id: string;
  profileId: string;
  status: 'draft' | 'complete';

  // Step 1: Title
  videoTopic: string;
  generatedTitles: string[];
  selectedTitle: string;
  thumbnailIdea: string;

  // Step 2: Description
  keyPhrases: KeyPhrase[];
  descriptionTemplate?: string;
  generatedDescription: string;
  editedDescription: string;

  // Step 3: Tags
  generatedTags: string[];
  customTags: string[];
  finalTags: string[];

  // Step 4: Thumbnail (independent)
  thumbnailPrompt: string;
  generatedThumbnails: string[];
  selectedThumbnail: string | null;

  // Step 5: Video Hook (independent)
  srtText: string;
  parsedScenes: SRTScene[];
  veoModel: 'standard' | 'fast';

  // Metadata
  currentStep: WorkflowStep;
  createdAt: number;
  updatedAt: number;
}

// === Description Templates ===

export interface DescriptionTemplate {
  id: string;
  name: string;
  profileId: string;
  structure: TemplateSection[];
  createdAt: number;
  updatedAt: number;
}

export interface TemplateSection {
  id: string;
  type: 'ai-generated' | 'static' | 'key-phrases' | 'social-links';
  label: string;
  content: string;
  order: number;
}

// === Tag Generation ===

export interface TagGenerationRequest {
  title: string;
  description: string;
  topic: string;
  existingTags?: string[];
  maxTags?: number;
  maxTotalChars?: number;
}

export interface TagGenerationResult {
  tags: string[];
  totalCharCount: number;
}
