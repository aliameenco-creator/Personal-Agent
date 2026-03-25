/**
 * Strips all metadata (C2PA, EXIF, IPTC, XMP) from a base64 image
 * by re-encoding it through an HTML Canvas.
 */
export function stripImageMetadata(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Could not get canvas context'));
      ctx.drawImage(img, 0, 0);
      const mime = dataUrl.match(/^data:(image\/\w+);/)?.[1] || 'image/png';
      const quality = mime === 'image/jpeg' ? 0.95 : undefined;
      resolve(canvas.toDataURL(mime, quality));
    };
    img.onerror = () => reject(new Error('Failed to load image for metadata stripping'));
    img.src = dataUrl;
  });
}
