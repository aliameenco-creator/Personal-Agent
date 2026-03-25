import { LinkedInBrandKit } from '../../types/linkedin';

const STORAGE_KEY = 'brandify_li_brandkit';

export function getBrandKit(): LinkedInBrandKit | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function saveBrandKit(kit: LinkedInBrandKit): void {
  const updated = { ...kit, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearBrandKit(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function createDefaultBrandKit(): LinkedInBrandKit {
  return {
    id: Math.random().toString(36).substr(2, 9),
    brandName: '',
    tagline: '',
    socialHandle: '',
    fontPreference: 'Modern Sans',
    colors: {
      primary: '#6B21A8',
      secondary: '#EC4899',
    },
    whiteLogo: null,
    blackLogo: null,
    profilePhoto: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
