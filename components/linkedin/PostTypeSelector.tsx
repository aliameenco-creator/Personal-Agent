import React from 'react';
import { Image, Layers } from 'lucide-react';
import { LinkedInPostType } from '../../types/linkedin';

interface PostTypeSelectorProps {
  postType: LinkedInPostType;
  onChange: (type: LinkedInPostType) => void;
}

export const PostTypeSelector: React.FC<PostTypeSelectorProps> = ({ postType, onChange }) => {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onChange('single')}
        className={`flex-1 p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
          postType === 'single'
            ? 'border-brand-primary bg-gradient-to-br from-brand-surface-container-high to-brand-surface-container-high shadow-lg shadow-brand-outline-variant/50'
            : 'border-brand-outline-variant bg-brand-surface-container-highest hover:border-brand-outline-variant hover:bg-brand-surface-container-high/30'
        }`}
      >
        <div className={`p-3 rounded-xl ${postType === 'single' ? 'bg-gradient-to-r from-brand-primary to-brand-primary text-white' : 'bg-brand-surface-container text-brand-on-surface-variant'}`}>
          <Image size={24} />
        </div>
        <span className={`text-sm font-semibold ${postType === 'single' ? 'text-brand-primary' : 'text-brand-on-surface-variant'}`}>Single Image</span>
        <span className="text-[10px] text-brand-on-surface-variant">1080 x 1350</span>
      </button>
      <button
        onClick={() => onChange('carousel')}
        className={`flex-1 p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
          postType === 'carousel'
            ? 'border-brand-primary bg-gradient-to-br from-brand-surface-container-high to-brand-surface-container-high shadow-lg shadow-brand-outline-variant/50'
            : 'border-brand-outline-variant bg-brand-surface-container-highest hover:border-brand-outline-variant hover:bg-brand-surface-container-high/30'
        }`}
      >
        <div className={`p-3 rounded-xl ${postType === 'carousel' ? 'bg-gradient-to-r from-brand-primary to-brand-primary text-white' : 'bg-brand-surface-container text-brand-on-surface-variant'}`}>
          <Layers size={24} />
        </div>
        <span className={`text-sm font-semibold ${postType === 'carousel' ? 'text-brand-primary' : 'text-brand-on-surface-variant'}`}>Carousel</span>
        <span className="text-[10px] text-brand-on-surface-variant">Multi-slide PDF</span>
      </button>
    </div>
  );
};
