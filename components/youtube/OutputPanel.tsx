import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Download } from 'lucide-react';
import { CopyButton } from '../shared/CopyButton';
import saveAs from 'file-saver';

interface OutputPanelProps {
  title: string;
  description: string;
  tags: string[];
  thumbnail: string | null;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ title, description, tags, thumbnail }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = title || description || tags.length > 0 || thumbnail;
  if (!hasContent) return null;

  const fullOutput = [
    title && `TITLE:\n${title}`,
    description && `\nDESCRIPTION:\n${description}`,
    tags.length > 0 && `\nTAGS:\n${tags.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const handleDownloadThumbnail = () => {
    if (!thumbnail) return;
    saveAs(thumbnail, `thumbnail-${title.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.png`);
  };

  return (
    <div className="border-t border-brand-outline-variant bg-brand-surface-container-highest/95 backdrop-blur-xl sticky bottom-0 z-20 shadow-[0_-10px_40px_-5px_rgba(139,92,246,0.1)]">
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-brand-surface-container-high/50 transition-colors"
      >
        <span className="text-sm font-bold gradient-text">Output Summary</span>
        <div className="flex items-center gap-3">
          <CopyButton text={fullOutput} label="Copy All" />
          {isExpanded ? <ChevronDown size={18} className="text-brand-on-surface-variant" /> : <ChevronUp size={18} className="text-brand-on-surface-variant" />}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-6 pb-4 space-y-3 max-h-80 overflow-y-auto border-t border-brand-surface-container">
          {title && (
            <div className="pt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-brand-on-surface-variant uppercase tracking-wider">Title</span>
                <CopyButton text={title} />
              </div>
              <p className="text-sm font-semibold text-brand-on-surface bg-brand-surface-container-high px-3 py-2 rounded-lg">{title}</p>
            </div>
          )}

          {description && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-brand-on-surface-variant uppercase tracking-wider">Description</span>
                <CopyButton text={description} />
              </div>
              <p className="text-xs text-brand-on-surface bg-brand-surface-container-low px-3 py-2 rounded-lg whitespace-pre-wrap max-h-32 overflow-y-auto">
                {description}
              </p>
            </div>
          )}

          {tags.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-brand-on-surface-variant uppercase tracking-wider">Tags ({tags.length})</span>
                <CopyButton text={tags.join(', ')} />
              </div>
              <p className="text-xs text-brand-on-surface-variant bg-brand-surface-container-low px-3 py-2 rounded-lg">{tags.join(', ')}</p>
            </div>
          )}

          {thumbnail && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-brand-on-surface-variant uppercase tracking-wider">Thumbnail</span>
                <button
                  onClick={handleDownloadThumbnail}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-on-surface-variant hover:text-brand-primary border border-brand-outline-variant px-3 py-1.5 rounded-lg hover:bg-brand-surface-container-high transition-all"
                >
                  <Download size={14} /> Download
                </button>
              </div>
              <img src={thumbnail} alt="Thumbnail" className="w-48 rounded-lg border border-brand-outline-variant" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
