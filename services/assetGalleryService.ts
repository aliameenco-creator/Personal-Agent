const STORAGE_KEY = 'pa_asset_gallery';

export interface GalleryAsset {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
  addedAt: number;
}

function loadAssets(): GalleryAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAssets(assets: GalleryAsset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

export function getAssets(): GalleryAsset[] {
  return loadAssets();
}

export function addAsset(file: File): Promise<GalleryAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const asset: GalleryAsset = {
        id: Math.random().toString(36).substring(2, 10),
        name: file.name,
        dataUrl: reader.result as string,
        mimeType: file.type,
        addedAt: Date.now(),
      };
      const assets = loadAssets();
      assets.unshift(asset);
      saveAssets(assets);
      resolve(asset);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function removeAsset(id: string) {
  const assets = loadAssets().filter(a => a.id !== id);
  saveAssets(assets);
}

export function renameAsset(id: string, name: string) {
  const assets = loadAssets();
  const asset = assets.find(a => a.id === id);
  if (asset) {
    asset.name = name;
    saveAssets(assets);
  }
}
