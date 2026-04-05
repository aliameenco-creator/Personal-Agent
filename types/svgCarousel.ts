export interface SvgSlide {
  id: string;
  index: number;
  svgCode: string | null;
  status: 'pending' | 'generating' | 'completed' | 'error';
  errorMessage?: string;
}

export interface SvgCarouselProject {
  id: string;
  topic: string;
  slideCount: number;
  slides: SvgSlide[];
  currentPhase: SvgCarouselPhase;
}

export type SvgCarouselPhase = 'setup' | 'generation' | 'download';
