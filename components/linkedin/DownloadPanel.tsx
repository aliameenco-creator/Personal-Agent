import React, { useState } from 'react';
import { GeneratedSlide, LinkedInPostType } from '../../types/linkedin';
import { Button } from '../Button';
import { Download, FileText, Image, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportCarouselPdf, downloadSingleImage } from '../../services/linkedin/pdfExportService';

interface DownloadPanelProps {
  slides: GeneratedSlide[];
  postType: LinkedInPostType;
  topic: string;
  onBack: () => void;
  onReset: () => void;
}

export const DownloadPanel: React.FC<DownloadPanelProps> = ({ slides, postType, topic, onBack, onReset }) => {
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  const completedSlides = slides.filter(s => s.status === 'completed' && s.imageDataUrl);
  const currentSlide = completedSlides[previewIndex];

  const slug = topic.substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase();

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    try {
      await exportCarouselPdf(completedSlides, `linkedin-carousel-${slug}`);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPng = () => {
    if (currentSlide?.imageDataUrl) {
      downloadSingleImage(currentSlide.imageDataUrl, `linkedin-post-${slug}`);
    }
  };

  const handleDownloadAllPng = () => {
    completedSlides.forEach((slide, i) => {
      if (slide.imageDataUrl) {
        setTimeout(() => {
          downloadSingleImage(slide.imageDataUrl!, `linkedin-slide-${i + 1}-${slug}`);
        }, i * 200);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-brand-on-surface">Download</h3>
        <p className="text-xs text-brand-primary mt-0.5">
          {postType === 'carousel'
            ? 'Download as PDF for LinkedIn carousel upload, or as individual images.'
            : 'Download your LinkedIn post image.'}
        </p>
      </div>

      {/* Preview */}
      {currentSlide && (
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-full max-w-sm mx-auto">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border-2 border-brand-outline-variant shadow-lg">
              <img src={currentSlide.imageDataUrl!} alt={`Slide ${previewIndex + 1}`} className="w-full h-full object-cover" />
            </div>

            {/* Navigation arrows for carousel */}
            {completedSlides.length > 1 && (
              <>
                <button
                  onClick={() => setPreviewIndex(Math.max(0, previewIndex - 1))}
                  disabled={previewIndex === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-brand-surface-container-highest/90 rounded-full shadow-lg hover:bg-brand-surface-container disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={20} className="text-brand-primary" />
                </button>
                <button
                  onClick={() => setPreviewIndex(Math.min(completedSlides.length - 1, previewIndex + 1))}
                  disabled={previewIndex === completedSlides.length - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-surface-container-highest/90 rounded-full shadow-lg hover:bg-brand-surface-container disabled:opacity-30 transition-all"
                >
                  <ChevronRight size={20} className="text-brand-primary" />
                </button>
              </>
            )}
          </div>

          {/* Dots indicator */}
          {completedSlides.length > 1 && (
            <div className="flex gap-1.5">
              {completedSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === previewIndex ? 'bg-brand-primary w-4' : 'bg-brand-outline-variant hover:bg-brand-outline-variant'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Download buttons */}
      <div className="space-y-2">
        {postType === 'carousel' && (
          <Button onClick={handleDownloadPdf} isLoading={isExporting} className="w-full h-11 text-sm">
            <FileText size={16} className="mr-2" /> Download as PDF (Carousel)
          </Button>
        )}

        {postType === 'single' ? (
          <Button onClick={handleDownloadPng} className="w-full h-11 text-sm">
            <Image size={16} className="mr-2" /> Download as PNG
          </Button>
        ) : (
          <Button variant="secondary" onClick={handleDownloadAllPng} className="w-full h-11 text-sm">
            <Download size={16} className="mr-2" /> Download All as PNG
          </Button>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="h-10 text-sm">
          <ArrowLeft size={16} className="mr-1.5" /> Back
        </Button>
        <Button variant="secondary" onClick={onReset} className="flex-1 h-10 text-sm">
          Create New Post
        </Button>
      </div>
    </div>
  );
};
