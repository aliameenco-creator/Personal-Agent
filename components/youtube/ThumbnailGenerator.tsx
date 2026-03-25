import React, { useState } from 'react';
import { ImageIcon, Sparkles, Download, Loader2 } from 'lucide-react';
import { Button } from '../Button';
import saveAs from 'file-saver';

interface ThumbnailGeneratorProps {
  thumbnailPrompt: string;
  thumbnailIdea: string;
  title: string;
  generatedThumbnails: string[];
  selectedThumbnail: string | null;
  isLoading: boolean;
  error: string | null;
  onPromptChange: (prompt: string) => void;
  onGenerate: () => void;
  onSelectThumbnail: (url: string) => void;
  onBack: () => void;
}

export const ThumbnailGenerator: React.FC<ThumbnailGeneratorProps> = ({
  thumbnailPrompt,
  thumbnailIdea,
  title,
  generatedThumbnails,
  selectedThumbnail,
  isLoading,
  error,
  onPromptChange,
  onGenerate,
  onSelectThumbnail,
  onBack,
}) => {
  const effectivePrompt = thumbnailPrompt || thumbnailIdea || '';

  const handleDownload = (imageUrl: string) => {
    saveAs(imageUrl, `thumbnail-${title.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.png`);
  };

  return (
    <div className="space-y-6">
      <div className="card-bright rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon size={20} className="text-brand-primary" />
          <h3 className="text-lg font-bold font-display gradient-text">Thumbnail Generator</h3>
        </div>
        <p className="text-xs text-brand-on-surface-variant">
          Generate a click-worthy YouTube thumbnail. You can use this at any time — it works independently.
        </p>

        {/* Title input (if not set) */}
        {!title && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-primary uppercase tracking-wider">Video Title</label>
            <input
              type="text"
              placeholder="Enter a title for your thumbnail..."
              className="w-full px-4 py-3 bg-brand-surface-container-high border-2 border-brand-outline-variant rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm font-medium"
            />
          </div>
        )}

        {/* Concept/prompt */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-brand-primary uppercase tracking-wider">Thumbnail Concept</label>
          <textarea
            value={effectivePrompt}
            onChange={e => onPromptChange(e.target.value)}
            placeholder="Describe what the thumbnail should show..."
            className="w-full px-4 py-3 bg-brand-surface-container-high border-2 border-brand-outline-variant rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm font-medium resize-none h-24"
          />
          {thumbnailIdea && !thumbnailPrompt && (
            <p className="text-xs text-brand-primary italic">Pre-filled from Step 1 thumbnail idea</p>
          )}
        </div>

        <Button
          onClick={onGenerate}
          disabled={!effectivePrompt.trim() || isLoading}
          isLoading={isLoading}
          className="h-12 px-8 font-semibold"
        >
          <span className="flex items-center gap-2">
            Generate Thumbnail <Sparkles size={16} className={isLoading ? 'hidden' : ''} />
          </span>
        </Button>

        {error && (
          <div className="bg-rose-900/30 border border-rose-200 text-rose-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}
      </div>

      {/* Generated Thumbnails */}
      {generatedThumbnails.length > 0 && (
        <div className="card-bright rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-brand-on-surface uppercase tracking-wider">Generated Thumbnails</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {generatedThumbnails.map((thumb, i) => (
              <div
                key={i}
                onClick={() => onSelectThumbnail(thumb)}
                className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedThumbnail === thumb
                    ? 'border-brand-primary shadow-lg shadow-brand-outline-variant'
                    : 'border-brand-outline-variant hover:border-brand-outline-variant'
                }`}
              >
                <img src={thumb} alt={`Thumbnail option ${i + 1}`} className="w-full aspect-video object-cover" />
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDownload(thumb);
                  }}
                  className="absolute bottom-2 right-2 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-start">
        <Button onClick={onBack} variant="outline" className="px-6 py-3 font-semibold">
          ← Back: Tags
        </Button>
      </div>
    </div>
  );
};
