import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Plus, Trash2, FolderOpen, Check, Image as ImageIcon } from 'lucide-react';
import { GalleryAsset, getAssets, addAsset, removeAsset } from '../../services/assetGalleryService';

interface AssetGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assets: GalleryAsset[]) => void;
  multiple?: boolean;
  maxSelect?: number;
}

export const AssetGallery: React.FC<AssetGalleryProps> = ({
  isOpen,
  onClose,
  onSelect,
  multiple = false,
  maxSelect = 3,
}) => {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setAssets(getAssets());
  }, []);

  useEffect(() => {
    if (isOpen) {
      refresh();
      setSelected(new Set());
    }
  }, [isOpen, refresh]);

  const handleAddFiles = async (files: FileList | File[]) => {
    const fileArr = Array.from(files).filter(f => f.type.startsWith('image/'));
    for (const file of fileArr) {
      await addAsset(file);
    }
    refresh();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleAddFiles(e.target.files);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = (id: string) => {
    removeAsset(id);
    setSelected(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    refresh();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) {
          next.clear();
        }
        if (next.size < maxSelect) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedAssets = assets.filter(a => selected.has(a.id));
    onSelect(selectedAssets);
    onClose();
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      await handleAddFiles(e.dataTransfer.files);
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-brand-surface-container-highest rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-brand-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-surface-container rounded-lg">
              <FolderOpen size={18} className="text-brand-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-brand-on-surface">Asset Gallery</h2>
              <p className="text-xs text-brand-on-surface-variant">
                {assets.length} image{assets.length !== 1 ? 's' : ''} saved
                {selected.size > 0 && ` • ${selected.size} selected`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-brand-surface-container text-brand-on-surface-variant hover:text-brand-on-surface transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          className={`flex-1 overflow-y-auto p-4 transition-colors ${isDragging ? 'bg-brand-primary/5' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {assets.length === 0 && !isDragging ? (
            <div
              className="flex flex-col items-center justify-center h-60 border-2 border-dashed border-brand-outline-variant rounded-xl cursor-pointer hover:border-brand-primary hover:bg-brand-surface-container-high transition-all"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={40} className="text-brand-on-surface-variant mb-3" />
              <p className="text-sm font-semibold text-brand-on-surface">No assets yet</p>
              <p className="text-xs text-brand-on-surface-variant mt-1">Click or drag & drop images to add them</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {/* Add new button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all ${
                  isDragging
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-brand-outline-variant hover:border-brand-primary hover:bg-brand-surface-container-high'
                }`}
              >
                <Plus size={24} className="text-brand-primary mb-1" />
                <span className="text-[10px] font-semibold text-brand-on-surface-variant">
                  {isDragging ? 'Drop here' : 'Add'}
                </span>
              </button>

              {/* Asset grid */}
              {assets.map(asset => {
                const isSelected = selected.has(asset.id);
                return (
                  <div
                    key={asset.id}
                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group transition-all ${
                      isSelected
                        ? 'ring-2 ring-brand-primary ring-offset-2 ring-offset-brand-surface-container-highest'
                        : 'hover:ring-1 hover:ring-brand-outline-variant'
                    }`}
                    onClick={() => toggleSelect(asset.id)}
                  >
                    <img src={asset.dataUrl} alt={asset.name} className="w-full h-full object-cover" />

                    {/* Selection overlay */}
                    <div className={`absolute inset-0 transition-all ${
                      isSelected ? 'bg-brand-primary/20' : 'bg-black/0 group-hover:bg-black/20'
                    }`} />

                    {/* Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 left-2 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center shadow-lg">
                        <Check size={14} className="text-white" />
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                      className="absolute top-2 right-2 p-1.5 bg-brand-surface-dim/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 text-brand-on-surface hover:text-white"
                    >
                      <Trash2 size={12} />
                    </button>

                    {/* Name label */}
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-[10px] text-white font-medium truncate">{asset.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-brand-surface-container-high flex items-center justify-between">
          <p className="text-xs text-brand-on-surface-variant">
            {multiple ? `Select up to ${maxSelect} images` : 'Select one image'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-brand-on-surface-variant hover:text-brand-on-surface bg-brand-surface-container rounded-lg hover:bg-brand-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-br from-brand-primary to-brand-primary-container rounded-lg hover:shadow-[0_4px_20px_rgba(255,73,0,0.25)] disabled:opacity-40 disabled:hover:shadow-none transition-all"
            >
              Use Selected ({selected.size})
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          multiple
        />
      </div>
    </div>
  );
};
