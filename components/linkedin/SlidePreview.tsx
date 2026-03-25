import React, { useState } from 'react';
import { GeneratedSlide } from '../../types/linkedin';
import { Button } from '../Button';
import { ImageModal } from '../ImageModal';
import { RefreshCw, Loader2, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, Maximize2, MessageSquare, Send, X } from 'lucide-react';

interface SlidePreviewProps {
  slides: GeneratedSlide[];
  generatingIndex: number | null;
  onRegenerate: (slideId: string) => void;
  onEditSlide: (slideId: string, message: string) => void;
  onBack: () => void;
  onNext: () => void;
  isLoading: boolean;
}

export const SlidePreview: React.FC<SlidePreviewProps> = ({ slides, generatingIndex, onRegenerate, onEditSlide, onBack, onNext, isLoading }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState('');

  const completedCount = slides.filter(s => s.status === 'completed').length;
  const allDone = !isLoading && slides.length > 0;

  const handleSendEdit = (slideId: string) => {
    const trimmed = editMessage.trim();
    if (!trimmed) return;
    onEditSlide(slideId, trimmed);
    setEditMessage('');
    setEditingSlideId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-brand-on-surface">Generating Slides</h3>
          <p className="text-xs text-brand-primary mt-0.5">
            {isLoading
              ? `Generating slides in parallel...`
              : `${completedCount} of ${slides.length} slides completed`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-2 bg-brand-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-brand-primary rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / slides.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-brand-primary">{completedCount}/{slides.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {slides.map((slide) => (
          <div key={slide.id} className="relative group">
            <div
              className={`aspect-[3/4] rounded-xl overflow-hidden border-2 border-brand-surface-container bg-brand-surface-container-high ${
                slide.status === 'completed' ? 'cursor-pointer hover:border-brand-outline-variant transition-all' : ''
              }`}
              onClick={() => {
                if (slide.status === 'completed' && slide.imageDataUrl) {
                  setPreviewImage(slide.imageDataUrl);
                }
              }}
            >
              {slide.status === 'completed' && slide.imageDataUrl ? (
                <img src={slide.imageDataUrl} alt={`Slide ${slide.index + 1}`} className="w-full h-full object-cover" />
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
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewImage(slide.imageDataUrl); }}
                      className="p-1.5 bg-brand-surface-container-highest/90 rounded-lg hover:bg-brand-surface-container transition-colors"
                      title="Zoom"
                    >
                      <Maximize2 size={12} className="text-brand-primary" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingSlideId(slide.id); }}
                      className="p-1.5 bg-brand-surface-container-highest/90 rounded-lg hover:bg-brand-surface-container transition-colors"
                      title="Edit with prompt"
                    >
                      <MessageSquare size={12} className="text-brand-primary" />
                    </button>
                  </>
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

      {/* Edit prompt inline panel */}
      {editingSlideId && (
        <div className="p-4 bg-brand-surface-container-high border-2 border-brand-outline-variant rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-brand-primary" />
              <span className="text-sm font-semibold text-brand-primary">
                Edit Slide {(slides.find(s => s.id === editingSlideId)?.index ?? 0) + 1}
              </span>
            </div>
            <button onClick={() => { setEditingSlideId(null); setEditMessage(''); }}
              className="p-1 text-brand-primary hover:text-brand-primary transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={editMessage}
              onChange={e => setEditMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendEdit(editingSlideId);
                }
              }}
              placeholder="e.g. Make the headline bigger, change background to blue..."
              className="flex-1 px-4 py-2.5 text-sm border-2 border-brand-outline-variant rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface-container-highest"
              autoFocus
            />
            <button
              onClick={() => handleSendEdit(editingSlideId)}
              disabled={!editMessage.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-primary text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="h-10 text-sm">
          <ArrowLeft size={16} className="mr-1.5" /> Back to Edit
        </Button>
        {allDone && completedCount > 0 && (
          <Button onClick={onNext} className="flex-1 h-10 text-sm">
            Continue to Download <ArrowRight size={16} className="ml-1.5" />
          </Button>
        )}
      </div>

      {/* Image zoom modal */}
      <ImageModal
        isOpen={!!previewImage}
        imageUrl={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};
