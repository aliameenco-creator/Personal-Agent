import React from 'react';
import { SlideContent } from '../../types/linkedin';
import { GripVertical, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface SlideCardProps {
  slide: SlideContent;
  totalSlides: number;
  onUpdate: (updates: Partial<SlideContent>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export const SlideCard: React.FC<SlideCardProps> = ({ slide, totalSlides, onUpdate, onMoveUp, onMoveDown, onRemove }) => {
  const isFirst = slide.index === 0;
  const isLast = slide.index === totalSlides - 1;

  return (
    <div className="card-bright p-4 rounded-xl border-2 border-brand-surface-container hover:border-brand-outline-variant transition-all group">
      <div className="flex items-start gap-3">
        {/* Reorder controls */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <span className="text-xs font-bold text-brand-primary bg-brand-surface-container w-6 h-6 rounded-full flex items-center justify-center">
            {slide.index + 1}
          </span>
          <button onClick={onMoveUp} disabled={isFirst}
            className="p-0.5 text-brand-on-surface-variant hover:text-brand-primary disabled:opacity-30 transition-colors">
            <ChevronUp size={14} />
          </button>
          <button onClick={onMoveDown} disabled={isLast}
            className="p-0.5 text-brand-on-surface-variant hover:text-brand-primary disabled:opacity-30 transition-colors">
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            {isFirst && totalSlides > 1 && (
              <span className="text-[9px] bg-amber-900/40 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">HOOK</span>
            )}
            {isLast && totalSlides > 1 && (
              <span className="text-[9px] bg-emerald-900/40 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">CTA</span>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">Headline</label>
            <input
              type="text"
              value={slide.headline}
              onChange={e => onUpdate({ headline: e.target.value })}
              className="w-full px-3 py-2 text-sm border-2 border-brand-outline-variant rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface-container-highest text-brand-on-surface font-semibold transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-brand-primary uppercase tracking-wider mb-1">Body</label>
            <textarea
              value={slide.body}
              onChange={e => onUpdate({ body: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 text-sm border-2 border-brand-outline-variant rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface-container-highest text-brand-on-surface transition-all resize-none"
            />
          </div>

          <div className="flex gap-2 text-[10px] text-brand-primary">
            <span className="bg-brand-surface-container-high px-2 py-0.5 rounded-full">{slide.layoutSuggestion}</span>
          </div>
        </div>

        {/* Remove */}
        {totalSlides > 1 && (
          <button onClick={onRemove}
            className="p-1.5 text-brand-outline-variant hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
