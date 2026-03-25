import { LinkedInBrandKit, SlideContent } from '../../types/linkedin';
import { stripImageMetadata } from '../../utils/stripMetadata';
import { apiPost } from '../apiClient';

interface SlideImageRequest {
  slideContent: SlideContent;
  brandKit: LinkedInBrandKit;
  slideIndex: number;
  totalSlides: number;
  referenceImages?: string[];
}

export async function generateSlideImage(request: SlideImageRequest): Promise<string> {
  const { image } = await apiPost('linkedin/slide-image', request);
  return stripImageMetadata(image);
}

export async function editSlideImage(currentImage: string, userMessage: string): Promise<string> {
  const { image } = await apiPost('linkedin/edit-slide', { currentImage, userMessage });
  return stripImageMetadata(image);
}
