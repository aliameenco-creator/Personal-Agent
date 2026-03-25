import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  fileName?: string;
  onClose: () => void;
  onDownload?: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, imageUrl, fileName, onClose, onDownload }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/50 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
      >
        <X size={32} />
      </button>
      
      <div className="relative max-w-full max-h-full flex flex-col items-center justify-center h-full w-full" onClick={e => e.stopPropagation()}>
        <img 
          src={imageUrl} 
          alt="Full size preview" 
          className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        />
        
        <div className="mt-6 flex flex-col items-center gap-2">
            {fileName && <span className="text-white/70 text-sm">{fileName}</span>}
            {onDownload && (
                <button 
                onClick={onDownload}
                className="px-6 py-2.5 bg-brand-surface-container-highest text-slate-900 rounded-full font-medium hover:bg-slate-200 transition-colors flex items-center gap-2 shadow-lg shadow-white/10"
                >
                <Download size={18} /> Download Image
                </button>
            )}
        </div>
      </div>
    </div>
  );
};