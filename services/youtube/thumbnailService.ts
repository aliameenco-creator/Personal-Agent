import { stripImageMetadata } from '../../utils/stripMetadata';
import { apiPost } from '../apiClient';

interface ThumbnailRequest {
  title: string;
  thumbnailIdea: string;
  channelName?: string;
}

export async function generateThumbnail(request: ThumbnailRequest): Promise<string> {
  const { image } = await apiPost('youtube/thumbnail', request);
  return stripImageMetadata(image);
}
