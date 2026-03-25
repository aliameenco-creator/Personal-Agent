import jsPDF from 'jspdf';
import saveAs from 'file-saver';
import { GeneratedSlide } from '../../types/linkedin';

/**
 * Exports carousel slides as a single PDF file for LinkedIn upload.
 * Each slide becomes one page at 1080x1350 dimensions.
 */
export async function exportCarouselPdf(slides: GeneratedSlide[], filename: string): Promise<void> {
  const completedSlides = slides.filter(s => s.status === 'completed' && s.imageDataUrl);
  if (completedSlides.length === 0) {
    throw new Error('No completed slides to export.');
  }

  // LinkedIn carousel dimensions: 1080x1350 (4:5 ratio)
  // jsPDF uses mm by default, convert pixels to mm at 96 DPI
  // 1080px / 96 * 25.4 = 285.75mm, 1350px / 96 * 25.4 = 357.19mm
  const pageWidthMm = 285.75;
  const pageHeightMm = 357.19;

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
    const imgData = slide.imageDataUrl!;

    // Detect image format
    const format = imgData.includes('image/png') ? 'PNG' : 'JPEG';

    doc.addImage(imgData, format, 0, 0, pageWidthMm, pageHeightMm);
  }

  const blob = doc.output('blob');
  saveAs(blob, filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/**
 * Downloads a single slide image as PNG.
 */
export function downloadSingleImage(dataUrl: string, filename: string): void {
  saveAs(dataUrl, filename.endsWith('.png') ? filename : `${filename}.png`);
}
