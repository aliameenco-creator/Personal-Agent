import React, { useRef } from 'react';
import { FileUpload } from '../FileUpload';
import { ReferencePost } from '../../types/linkedin';
import { Lightbulb, ImagePlus, ToggleLeft, ToggleRight, X } from 'lucide-react';

interface TopicInputProps {
  topic: string;
  onTopicChange: (topic: string) => void;
  referencePost: ReferencePost;
  onReferenceChange: (ref: ReferencePost) => void;
}

export const TopicInput: React.FC<TopicInputProps> = ({ topic, onTopicChange, referencePost, onReferenceChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefToggle = () => {
    onReferenceChange({ ...referencePost, enabled: !referencePost.enabled });
  };

  const handleRefImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files) as File[];
    const readers = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(images => {
      onReferenceChange({ ...referencePost, images: [...referencePost.images, ...images] });
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeRefImage = (index: number) => {
    const updated = referencePost.images.filter((_, i) => i !== index);
    onReferenceChange({ ...referencePost, images: updated });
  };

  return (
    <div className="space-y-4">
      {/* Topic */}
      <div>
        <label className="block text-sm text-brand-on-surface font-semibold mb-2 flex items-center gap-2">
          <Lightbulb size={16} className="text-brand-primary" /> What's your post about?
        </label>
        <textarea
          value={topic}
          onChange={e => onTopicChange(e.target.value)}
          placeholder="e.g. 5 productivity tips for remote workers, or a thought leadership piece about AI in marketing..."
          rows={3}
          className="w-full px-4 py-3 text-sm border-2 border-brand-outline-variant rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface-container-highest text-brand-on-surface placeholder-brand-outline-variant font-medium transition-all resize-none"
        />
      </div>

      {/* Reference Post Toggle */}
      <div className="card-bright p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ImagePlus size={16} className="text-brand-primary" />
            <span className="text-sm font-semibold text-brand-on-surface">Reference Post</span>
            <span className="text-[10px] bg-brand-surface-container text-brand-primary px-2 py-0.5 rounded-full font-bold">Optional</span>
          </div>
          <button onClick={handleRefToggle} className="text-brand-primary hover:text-brand-primary transition-colors">
            {referencePost.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-brand-on-surface-variant" />}
          </button>
        </div>

        {referencePost.enabled && (
          <div className="mt-3 space-y-3">
            <p className="text-xs text-brand-primary">Upload screenshot(s) of a post you like. AI will match the style.</p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleRefImages}
              className="hidden"
            />

            {referencePost.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {referencePost.images.map((img, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-lg overflow-hidden border-2 border-brand-outline-variant">
                    <img src={img} alt={`Ref ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeRefImage(i)}
                      className="absolute top-0.5 right-0.5 p-1 bg-rose-900/300 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 border-2 border-dashed border-brand-outline-variant rounded-xl text-sm text-brand-primary font-semibold hover:border-brand-primary hover:bg-brand-surface-container-high transition-all"
            >
              + Add Reference Images
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
