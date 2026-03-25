import React from 'react';
import { SlideContent } from '../../types/linkedin';
import { SlideCard } from './SlideCard';
import { Button } from '../Button';
import { Sparkles, ArrowLeft } from 'lucide-react';

interface SlideEditorProps {
  slides: SlideContent[];
  onUpdateSlide: (id: string, updates: Partial<SlideContent>) => void;
  onReorder: (slides: SlideContent[]) => void;
  onGenerate: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({ slides, onUpdateSlide, onReorder, onGenerate, onBack, isLoading }) => {
  const moveSlide = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= slides.length) return;
    const updated = [...slides];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    onReorder(updated);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== index);
    onReorder(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-brand-on-surface">Edit Slide Content</h3>
          <p className="text-xs text-brand-primary mt-0.5">Review and edit the AI-generated content before generating visuals.</p>
        </div>
        <span className="text-sm font-semibold text-brand-primary bg-brand-surface-container px-3 py-1 rounded-full">
          {slides.length} slide{slides.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {slides.map((slide, i) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            totalSlides={slides.length}
            onUpdate={updates => onUpdateSlide(slide.id, updates)}
            onMoveUp={() => moveSlide(i, 'up')}
            onMoveDown={() => moveSlide(i, 'down')}
            onRemove={() => removeSlide(i)}
          />
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onBack} className="h-10 text-sm">
          <ArrowLeft size={16} className="mr-1.5" /> Back
        </Button>
        <Button onClick={onGenerate} isLoading={isLoading} className="flex-1 h-10 text-sm">
          <Sparkles size={16} className="mr-1.5" /> Generate Visuals
        </Button>
      </div>
    </div>
  );
};
