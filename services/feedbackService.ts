import { apiPost } from './apiClient';

export type SystemName = 'rebrand' | 'youtube' | 'linkedin' | 'thumbnail';

export async function submitFeedback(params: {
  system: SystemName;
  rating: number;
  comment?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await apiPost('feedback/submit', params);
}
