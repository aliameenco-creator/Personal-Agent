import React from 'react';
import { X } from 'lucide-react';

interface TagChipProps {
  tag: string;
  onRemove: (tag: string) => void;
}

export const TagChip: React.FC<TagChipProps> = ({ tag, onRemove }) => {
  return (
    <div className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-surface-container border border-brand-outline-variant rounded-lg text-sm font-medium text-brand-primary-container group hover:border-brand-outline-variant transition-colors">
      <span>{tag}</span>
      <button
        onClick={() => onRemove(tag)}
        className="text-brand-primary hover:text-rose-500 transition-colors opacity-60 group-hover:opacity-100 ml-0.5"
      >
        <X size={14} />
      </button>
    </div>
  );
};
