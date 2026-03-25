import React, { useRef, useState, useCallback } from 'react';
import { UploadedImage } from '../../types/thumbnail';
import { X, ImagePlus } from 'lucide-react';

interface ThumbnailImageUploadProps {
  label: string;
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  multiple?: boolean;
  maxImages?: number;
}

export const ThumbnailImageUpload: React.FC<ThumbnailImageUploadProps> = ({
  label,
  images,
  onChange,
  multiple = false,
  maxImages = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newImages: UploadedImage[] = imageFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));

    if (multiple) {
      const combined = [...images, ...newImages].slice(0, maxImages);
      onChange(combined);
    } else {
      onChange([newImages[0]]);
    }
  }, [images, multiple, maxImages, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [processFiles]);

  const removeImage = (id: string) => {
    onChange(images.filter(img => img.id !== id));
  };

  const canAddMore = multiple ? images.length < maxImages : images.length < 1;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-brand-on-surface">{label}</label>

      <div
        className={`relative rounded-xl transition-all duration-200 ${
          isDragging
            ? 'bg-brand-primary/10 ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface-container-highest'
            : ''
        }`}
        onDragOver={canAddMore ? handleDragOver : undefined}
        onDragLeave={canAddMore ? handleDragLeave : undefined}
        onDrop={canAddMore ? handleDrop : undefined}
      >
        <div className="flex flex-wrap gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative group w-24 h-24 rounded-xl overflow-hidden border-2 border-brand-outline-variant bg-brand-surface-container-high">
              <img src={img.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(img.id)}
                className="absolute top-1 right-1 p-1 bg-gradient-to-r from-brand-primary to-brand-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {canAddMore && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all group/add ${
                isDragging
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-brand-outline-variant text-brand-primary hover:border-brand-primary hover:bg-brand-surface-container-high'
              }`}
            >
              <ImagePlus size={22} className="transition-colors" />
              <span className="text-[10px] mt-1 font-semibold">
                {isDragging ? 'Drop here' : 'Add'}
              </span>
            </button>
          )}
        </div>

        {isDragging && canAddMore && (
          <div className="absolute inset-0 rounded-xl pointer-events-none" />
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
        multiple={multiple}
      />
      <p className="text-[10px] text-brand-on-surface-variant">
        {multiple ? `Max ${maxImages} images • Drag & drop or click to add` : 'Select one image • Drag & drop or click'}
      </p>
    </div>
  );
};
