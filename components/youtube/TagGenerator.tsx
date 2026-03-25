import React, { useState } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { Button } from '../Button';
import { TagChip } from './TagChip';
import { CharCounter } from '../shared/CharCounter';
import { CopyButton } from '../shared/CopyButton';

interface TagGeneratorProps {
  generatedTags: string[];
  customTags: string[];
  finalTags: string[];
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
  onAddCustomTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onBack: () => void;
}

export const TagGenerator: React.FC<TagGeneratorProps> = ({
  generatedTags,
  customTags,
  finalTags,
  isLoading,
  error,
  onGenerate,
  onAddCustomTag,
  onRemoveTag,
  onBack,
}) => {
  const [customInput, setCustomInput] = useState('');

  const allTags = [...new Set([...generatedTags, ...customTags])];
  const totalChars = allTags.join(',').length;

  const handleAddCustom = () => {
    if (!customInput.trim()) return;
    // Split by commas for bulk entry
    const tags = customInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    tags.forEach(tag => onAddCustomTag(tag));
    setCustomInput('');
  };

  return (
    <div className="space-y-6">
      {/* Generate Tags */}
      <div className="card-bright rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-display gradient-text">Generate Tags</h3>
            <p className="text-xs text-brand-on-surface-variant mt-1">AI + algorithmic tag generation based on your title and description</p>
          </div>
          <Button
            onClick={onGenerate}
            disabled={isLoading}
            isLoading={isLoading}
            className="h-10 px-6 font-semibold text-sm"
          >
            <span className="flex items-center gap-2">
              Generate <Sparkles size={14} className={isLoading ? 'hidden' : ''} />
            </span>
          </Button>
        </div>

        {error && (
          <div className="bg-rose-900/30 border border-rose-200 text-rose-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}
      </div>

      {/* Tags Display */}
      {allTags.length > 0 && (
        <div className="card-bright rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-on-surface uppercase tracking-wider">
              Tags ({allTags.length})
            </h3>
            <div className="flex items-center gap-3">
              <CharCounter current={totalChars} max={500} />
              <CopyButton text={allTags.join(', ')} label="Copy Tags" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <TagChip key={tag} tag={tag} onRemove={onRemoveTag} />
            ))}
          </div>

          {/* Add custom tag */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <input
              type="text"
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              placeholder="Add custom tags (comma-separated)..."
              className="flex-1 px-4 py-2 bg-brand-surface-container-high border border-brand-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
            <button
              onClick={handleAddCustom}
              disabled={!customInput.trim()}
              className="px-3 py-2 bg-brand-primary hover:bg-brand-primary disabled:bg-gray-300 text-white rounded-xl transition-colors text-sm font-semibold"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" className="px-6 py-3 font-semibold">
          ← Back: Description
        </Button>
      </div>
    </div>
  );
};
