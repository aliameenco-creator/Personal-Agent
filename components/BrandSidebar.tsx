import React from 'react';
import { FileUpload } from './FileUpload';
import { BrandAssets } from '../types';
import { Palette, ShieldCheck, ShieldAlert, Type, X } from 'lucide-react';

interface BrandSidebarProps {
  assets: BrandAssets;
  setAssets: React.Dispatch<React.SetStateAction<BrandAssets>>;
  isOpen?: boolean;
  onClose?: () => void;
}

export const BrandSidebar: React.FC<BrandSidebarProps> = ({ assets, setAssets, isOpen = true, onClose }) => {
  const updateAsset = (key: keyof BrandAssets, value: string | null) => {
    setAssets(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (key: keyof BrandAssets) => (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      updateAsset(key, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-brand-neutral/30 backdrop-blur-sm z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-72 sm:w-80 bg-brand-surface-container-highest/95 backdrop-blur-lg
        h-full flex flex-col overflow-y-auto shadow-[0_4px_40px_rgba(13,13,13,0.08)] lg:shadow-none
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 sm:p-6 bg-brand-surface-container-high flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-brand-on-surface">
              <Palette size={20} className="text-brand-primary" />
              Brand Assets
            </h2>
            <p className="text-xs sm:text-sm text-brand-on-surface-variant mt-1">Upload your logos and brand name.</p>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl hover:bg-brand-surface-container text-brand-on-surface-variant transition-colors"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 bg-brand-surface-container-highest">

          {/* Brand Name Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-accent uppercase tracking-widest text-brand-primary flex items-center gap-2">
              <span className="w-6 sm:w-8 h-[2px] bg-brand-primary"></span> Identity
            </h3>
            <div className="card-bright p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <label className="block text-sm text-brand-on-surface font-semibold mb-2 flex items-center gap-2">
                <Type size={16} className="text-brand-primary" /> Brand Name
              </label>
              <input
                type="text"
                value={assets.brandName || ''}
                onChange={(e) => updateAsset('brandName', e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm rounded-lg sm:rounded-xl bg-brand-surface-container-low focus:ring-2 focus:ring-brand-primary focus:bg-brand-surface-container text-brand-on-surface placeholder:text-brand-on-surface-variant/50 font-medium transition-all border-none outline-none"
              />
              <p className="text-[11px] sm:text-xs text-brand-on-surface-variant mt-2">Used to replace other brand names.</p>
            </div>
          </div>

          {/* Logos Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-accent uppercase tracking-widest text-brand-primary flex items-center gap-2">
              <span className="w-6 sm:w-8 h-[2px] bg-brand-primary"></span> Logos
            </h3>
            <p className="text-[11px] sm:text-xs text-brand-on-surface-variant -mt-1">AI automatically picks the right variant.</p>

            <div className="space-y-3 sm:space-y-4">
              <div className="card-bright p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-sm text-brand-on-surface font-semibold flex items-center gap-2">
                    White Logo
                    <span className="text-[9px] sm:text-[10px] bg-brand-secondary text-white px-1.5 sm:px-2 py-0.5 rounded-full font-bold">Dark BG</span>
                  </span>
                  {assets.whiteLogo ? <ShieldCheck size={16} className="text-brand-tertiary" /> : <ShieldAlert size={16} className="text-brand-outline-variant" />}
                </div>
                <FileUpload
                  label="Upload White Logo"
                  currentImage={assets.whiteLogo}
                  onFileSelect={handleLogoUpload('whiteLogo')}
                  onClear={() => updateAsset('whiteLogo', null)}
                  className="w-full"
                  compact={false}
                />
              </div>

              <div className="card-bright p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-sm text-brand-on-surface font-semibold flex items-center gap-2">
                    Black Logo
                    <span className="text-[9px] sm:text-[10px] bg-brand-surface-container text-brand-on-surface-variant px-1.5 sm:px-2 py-0.5 rounded-full font-bold">Light BG</span>
                  </span>
                  {assets.blackLogo ? <ShieldCheck size={16} className="text-brand-tertiary" /> : <ShieldAlert size={16} className="text-brand-outline-variant" />}
                </div>
                <FileUpload
                  label="Upload Black Logo"
                  currentImage={assets.blackLogo}
                  onFileSelect={handleLogoUpload('blackLogo')}
                  onClear={() => updateAsset('blackLogo', null)}
                  className="w-full"
                  compact={false}
                />
              </div>
            </div>
          </div>

        </div>

        <div className="p-3 sm:p-4 bg-brand-surface-container-high">
          <p className="text-[9px] sm:text-[10px] text-center text-brand-on-surface-variant uppercase tracking-widest font-bold">
            Personal Agent v2.0 • Gemini 3 Pro
          </p>
        </div>
      </div>
    </>
  );
};
