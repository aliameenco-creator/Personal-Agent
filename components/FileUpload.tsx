import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  label: string;
  accept?: string;
  onFileSelect: (files: FileList | null) => void;
  onClear?: () => void;
  currentImage?: string | null;
  className?: string;
  compact?: boolean;
  multiple?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = "image/*",
  onFileSelect,
  onClear,
  currentImage,
  className = "",
  compact = false,
  multiple = false
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) onClear();
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        ref={inputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        multiple={multiple}
      />

      {currentImage ? (
        <div className={`relative group border-2 border-brand-outline-variant rounded-xl overflow-hidden bg-brand-surface-container-high ${compact ? 'h-24 w-24' : 'w-full aspect-video'}`}>
          <img
            src={currentImage}
            alt="Preview"
            className="w-full h-full object-contain p-2"
          />
          <button
            onClick={handleClear}
            className="absolute top-1 right-1 p-1.5 bg-gradient-to-r from-brand-primary to-brand-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-brand-primary to-brand-primary text-white text-[10px] p-1.5 text-center truncate font-medium">
            {label}
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center border-2 border-dashed border-brand-outline-variant rounded-2xl hover:border-brand-primary hover:bg-brand-surface-container-high transition-all duration-300 text-brand-primary group/upload overflow-hidden ${compact ? 'h-24 w-24 p-2' : 'w-full py-10'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/0 via-brand-primary/5 to-brand-primary/0 group-hover/upload:via-brand-primary/10 transition-all duration-300"></div>
          <div className="relative bg-gradient-to-r from-brand-surface-container to-brand-surface-container p-3 rounded-2xl mb-3 group-hover/upload:scale-110 group-hover/upload:shadow-lg transition-all duration-300">
            <Upload size={compact ? 20 : 24} className="text-brand-primary group-hover/upload:text-brand-primary transition-colors" />
          </div>
          <span className={`text-sm font-semibold text-brand-primary group-hover/upload:text-brand-primary-container transition-colors relative z-10 ${compact ? 'text-[10px] text-center leading-tight' : ''}`}>{label}</span>
          {!compact && <span className="text-xs text-brand-primary mt-1 relative z-10">{multiple ? "Upload images" : "Click to upload"}</span>}
        </button>
      )}
    </div>
  );
};
