import { apiPost } from '../apiClient';

interface SvgGenerateRequest {
  topic: string;
  slideIndex: number;
  totalSlides: number;
}

export async function generateSvgSlide(request: SvgGenerateRequest): Promise<string> {
  const { svg } = await apiPost('svg-carousel/generate', request);
  return svg;
}
