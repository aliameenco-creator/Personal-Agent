import jsPDF from 'jspdf';
import saveAs from 'file-saver';
import { SvgSlide } from '../../types/svgCarousel';

/**
 * Converts an SVG string to a PNG data URL using a canvas.
 */
function svgToDataUrl(svgCode: string, width: number, height: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render SVG to image'));
    };
    img.src = url;
  });
}

/**
 * Exports SVG carousel slides as a single PDF.
 * Each slide becomes one page at 680x860 dimensions.
 */
export async function exportSvgCarouselPdf(slides: SvgSlide[], filename: string): Promise<void> {
  const completedSlides = slides.filter(s => s.status === 'completed' && s.svgCode);
  if (completedSlides.length === 0) {
    throw new Error('No completed slides to export.');
  }

  // SVG dimensions: 680x860
  // Convert to mm at 96 DPI: px / 96 * 25.4
  const pageWidthMm = (680 / 96) * 25.4;   // ~179.92mm
  const pageHeightMm = (860 / 96) * 25.4;  // ~227.54mm

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [pageWidthMm, pageHeightMm],
  });

  for (let i = 0; i < completedSlides.length; i++) {
    if (i > 0) {
      doc.addPage([pageWidthMm, pageHeightMm], 'portrait');
    }

    const slide = completedSlides[i];
    // Render SVG to PNG at 2x for crisp output
    const dataUrl = await svgToDataUrl(slide.svgCode!, 680 * 2, 860 * 2);
    doc.addImage(dataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm);
  }

  const blob = doc.output('blob');
  saveAs(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Downloads a single SVG slide as PNG.
 */
export async function downloadSvgAsPng(svgCode: string, filename: string): Promise<void> {
  const dataUrl = await svgToDataUrl(svgCode, 680 * 2, 860 * 2);
  saveAs(dataUrl, filename.endsWith('.png') ? filename : `${filename}.png`);
}

/**
 * Downloads a single SVG slide as SVG file.
 */
export function downloadSvgFile(svgCode: string, filename: string): void {
  const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, filename.endsWith('.svg') ? filename : `${filename}.svg`);
}
