import { BrandProfile } from '../../types/youtube';

const STORAGE_KEY = 'brandify_yt_profiles';

export function getProfiles(): BrandProfile[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveProfile(profile: BrandProfile): void {
  const profiles = getProfiles();
  const index = profiles.findIndex(p => p.id === profile.id);
  if (index >= 0) {
    profiles[index] = { ...profile, updatedAt: Date.now() };
  } else {
    profiles.push(profile);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function getDefaultProfile(): BrandProfile | null {
  const profiles = getProfiles();
  return profiles.length > 0 ? profiles[0] : null;
}
