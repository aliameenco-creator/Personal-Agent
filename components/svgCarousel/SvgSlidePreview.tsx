import React, { useState } from 'react';
import { SvgSlide } from '../../types/svgCarousel';
import { Button } from '../Button';
import { RefreshCw, Loader2, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Maximize2, X } from 'lucide-react';

interface SvgSlidePreviewProps {
  slides: SvgSlide[];
  onRegenerate: (slideId: string) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export const SvgSlidePreview: React.FC<SvgSlidePreviewProps> = ({ slides, onRegenerate, onBack, onNext, isLoading }) => {
  const [zoomedSlide, setZoomedSlide] = useState<SvgSlide | null>(null);

  const completedCount = slides.filter(s => s.status === 'completed').length;
  const allDone = !isLoading && slides.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-brand-on-surface">Generating SVG Slides</h3>
          <p className="text-xs text-brand-primary mt-0.5">
            {isLoading
              ? 'Generating all slides in parallel...'
              : `${completedCount} of ${slides.length} slides completed`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-brand-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-primary rounded-full transition-all duration-500"
              style={{ width: `${slides.length > 0 ? (completedCount / slides.length) * 100 : 0}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-brand-primary">{completedCount}/{slides.length}</span>
        </div>
      </div>

      {/* SVG Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {slides.map((slide) => (
          <div key={slide.id} className="relative group">
            <div
              className={`aspect-[680/860] rounded-xl overflow-hidden border-2 border-brand-surface-container bg-brand-surface-container-high ${
                slide.status === 'completed' ? 'cursor-pointer hover:border-brand-outline-variant transition-all' : ''
              }`}
              onClick={() => {
                if (slide.status === 'completed' && slide.svgCode) {
                  setZoomedSlide(slide);
                }
              }}
            >
              {slide.status === 'completed' && slide.svgCode ? (
                <div
                  className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                  dangerouslySetInnerHTML={{ __html: slide.svgCode }}
                />
              ) : slide.status === 'generating' ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <Loader2 size={24} className="text-brand-primary animate-spin" />
                  <span className="text-[10px] font-semibold text-brand-primary">Generating...</span>
                </div>
              ) : slide.status === 'error' ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-2">
                  <AlertCircle size={24} className="text-rose-500" />
                  <span className="text-[10px] font-semibold text-rose-500 text-center">{slide.errorMessage || 'Failed'}</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <span className="text-xs font-semibold text-brand-primary">Pending</span>
                </div>
              )}
            </div>

            {/* Slide number badge */}
            <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/60 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {slide.index + 1}
            </div>

            {/* Status badge */}
            {slide.status === 'completed' && (
              <div className="absolute top-1.5 right-1.5">
                <CheckCircle size={16} className="text-emerald-500 drop-shadow" />
              </div>
            )}

            {/* Action buttons overlay */}
            {(slide.status === 'completed' || slide.status === 'error') && !isLoading && (
              <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {slide.status === 'completed' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setZoomedSlide(slide); }}
                    className="p-1.5 bg-brand-surface-container-highest/90 rounded-lg hover:bg-brand-surface-container transition-colors"
                    title="Zoom"
                  >
                    <Maximize2 size={12} className="text-brand-primary" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onRegenerate(slide.id); }}
                  className="p-1.5 bg-brand-surface-container-highest/90 rounded-lg hover:bg-brand-surface-container transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw size={12} className="text-brand-primary" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="h-10 text-sm">
          <ArrowLeft size={16} className="mr-1.5" /> Back
        </Button>
        {allDone && completedCount > 0 && (
          <Button onClick={onNext} className="flex-1 h-10 text-sm">
            Continue to Download <ArrowRight size={16} className="ml-1.5" />
          </Button>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomedSlide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setZoomedSlide(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setZoomedSlide(null)}
              className="absolute -top-10 right-0 p-2 text-white hover:text-brand-primary transition-colors"
            >
              <X size={24} />
            </button>
            <div
              className="w-full rounded-2xl overflow-hidden shadow-2xl bg-white [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
              dangerouslySetInnerHTML={{ __html: zoomedSlide.svgCode! }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
