import React from 'react';
import { FileUpload } from '../FileUpload';
import { LinkedInBrandKit } from '../../types/linkedin';
import { Palette, Type, AtSign, Paintbrush, User, X, Save, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '../Button';

interface BrandKitPanelProps {
  brandKit: LinkedInBrandKit;
  onChange: (kit: LinkedInBrandKit) => void;
  onSave: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const BrandKitPanel: React.FC<BrandKitPanelProps> = ({ brandKit, onChange, onSave, isOpen, onClose }) => {
  const update = (key: keyof LinkedInBrandKit, value: any) => {
    onChange({ ...brandKit, [key]: value });
  };

  const handleImageUpload = (key: 'whiteLogo' | 'blackLogo' | 'profilePhoto') => (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onloadend = () => update(key, reader.result as string);
    reader.readAsDataURL(files[0]);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 lg:hidden" onClick={onClose} />
      )}

      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-72 sm:w-80 bg-brand-surface-container-highest/95 backdrop-blur-lg border-r border-brand-surface-container
        h-full flex flex-col overflow-y-auto shadow-xl lg:shadow-sm
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 sm:p-6 border-b border-brand-surface-container bg-gradient-to-br from-brand-surface-container-high to-brand-surface-container-high flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-display gradient-text flex items-center gap-2">
              <Palette size={20} className="text-brand-primary" />
              Brand Kit
            </h2>
            <p className="text-xs sm:text-sm text-brand-primary mt-1">Set up once, use everywhere.</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-2 rounded-xl hover:bg-brand-surface-container text-brand-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 flex-1 bg-brand-surface-container-highest">

          {/* Identity */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-accent uppercase tracking-widest bg-gradient-to-r from-brand-primary to-brand-primary bg-clip-text text-transparent flex items-center gap-2">
              <span className="w-6 h-[2px] bg-gradient-to-r from-brand-primary to-brand-primary"></span> Identity
            </h3>

            <div className="card-bright p-3 rounded-xl space-y-3">
              <div>
                <label className="block text-sm text-brand-on-surface font-semibold mb-1.5 flex items-center gap-2">
                  <Type size={14} className="text-brand-primary" /> Brand Name
                </label>
                <input type="text" value={brandKit.brandName} onChange={e => update('brandName', e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full px-3 py-2.5 text-sm border-2 border-brand-outline-variant rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface-container-highest text-brand-on-surface placeholder:text-brand-on-surface-variant font-medium transition-all" />
              </div>
              <div>
                <label className="block text-sm text-brand-on-surface font-semibold mb-1.5 flex items-center gap-2">
                  <Type size={14} className="text-brand-primary" /> Tagline
                </label>
                <input type="text" value={brandKit.tagline} onChange={e => update('tagline', e.target.value)}
                  placeholder="e.g. Innovation meets design"
                  className="w-full px-3 py-2.5 text-sm border-2 border-brand-outline-variant rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface-container-highest text-brand-on-surface placeholder:text-brand-on-surface-variant font-medium transition-all" />
              </div>
              <div>
                <label className="block text-sm text-brand-on-surface font-semibold mb-1.5 flex items-center gap-2">
                  <AtSign size={14} className="text-brand-primary" /> Social Handle
                </label>
                <input type="text" value={brandKit.socialHandle} onChange={e => update('socialHandle', e.target.value)}
                  placeholder="e.g. @acmecorp"
                  className="w-full px-3 py-2.5 text-sm border-2 border-brand-outline-variant rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface-container-highest text-brand-on-surface placeholder:text-brand-on-surface-variant font-medium transition-all" />
              </div>
              <div>
                <label className="block text-sm text-brand-on-surface font-semibold mb-1.5 flex items-center gap-2">
                  <Paintbrush size={14} className="text-brand-primary" /> Font Preference
                </label>
                <select value={brandKit.fontPreference} onChange={e => update('fontPreference', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border-2 border-brand-outline-variant rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface-container-highest text-brand-on-surface font-medium transition-all">
                  <option value="Modern Sans">Modern Sans</option>
                  <option value="Classic Serif">Classic Serif</option>
                  <option value="Bold Display">Bold Display</option>
                  <option value="Minimal Clean">Minimal Clean</option>
                  <option value="Playful Rounded">Playful Rounded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-accent uppercase tracking-widest bg-gradient-to-r from-brand-primary to-brand-primary bg-clip-text text-transparent flex items-center gap-2">
              <span className="w-6 h-[2px] bg-gradient-to-r from-brand-primary to-brand-primary"></span> Colors
            </h3>
            <div className="card-bright p-3 rounded-xl space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-brand-on-surface-variant font-semibold mb-1.5">Primary</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={brandKit.colors.primary}
                      onChange={e => update('colors', { ...brandKit.colors, primary: e.target.value })}
                      className="w-10 h-10 rounded-lg border-2 border-brand-outline-variant cursor-pointer" />
                    <input type="text" value={brandKit.colors.primary}
                      onChange={e => update('colors', { ...brandKit.colors, primary: e.target.value })}
                      className="flex-1 px-2 py-2 text-xs border-2 border-brand-outline-variant rounded-lg bg-brand-surface-container-highest text-brand-on-surface font-mono" />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-brand-on-surface-variant font-semibold mb-1.5">Secondary</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={brandKit.colors.secondary}
                      onChange={e => update('colors', { ...brandKit.colors, secondary: e.target.value })}
                      className="w-10 h-10 rounded-lg border-2 border-brand-outline-variant cursor-pointer" />
                    <input type="text" value={brandKit.colors.secondary}
                      onChange={e => update('colors', { ...brandKit.colors, secondary: e.target.value })}
                      className="flex-1 px-2 py-2 text-xs border-2 border-brand-outline-variant rounded-lg bg-brand-surface-container-highest text-brand-on-surface font-mono" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logos */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-accent uppercase tracking-widest bg-gradient-to-r from-brand-primary to-brand-primary bg-clip-text text-transparent flex items-center gap-2">
              <span className="w-6 h-[2px] bg-gradient-to-r from-brand-primary to-brand-primary"></span> Logos
            </h3>
            <div className="space-y-3">
              <div className="card-bright p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-brand-on-surface font-semibold flex items-center gap-2">
                    White Logo
                    <span className="text-[9px] bg-brand-surface-container text-brand-primary px-1.5 py-0.5 rounded-full font-bold">Dark BG</span>
                  </span>
                  {brandKit.whiteLogo ? <ShieldCheck size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-brand-outline-variant" />}
                </div>
                <FileUpload label="Upload White Logo" currentImage={brandKit.whiteLogo}
                  onFileSelect={handleImageUpload('whiteLogo')} onClear={() => update('whiteLogo', null)} />
              </div>
              <div className="card-bright p-3 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-brand-on-surface font-semibold flex items-center gap-2">
                    Black Logo
                    <span className="text-[9px] bg-brand-surface-container text-brand-primary-container px-1.5 py-0.5 rounded-full font-bold">Light BG</span>
                  </span>
                  {brandKit.blackLogo ? <ShieldCheck size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-brand-outline-variant" />}
                </div>
                <FileUpload label="Upload Black Logo" currentImage={brandKit.blackLogo}
                  onFileSelect={handleImageUpload('blackLogo')} onClear={() => update('blackLogo', null)} />
              </div>
            </div>
          </div>

          {/* Profile Photo */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-accent uppercase tracking-widest bg-gradient-to-r from-brand-primary to-brand-primary bg-clip-text text-transparent flex items-center gap-2">
              <span className="w-6 h-[2px] bg-gradient-to-r from-brand-primary to-brand-primary"></span> Profile Photo
            </h3>
            <div className="card-bright p-3 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-brand-on-surface font-semibold flex items-center gap-2">
                  <User size={14} className="text-brand-primary" /> Headshot
                </span>
                {brandKit.profilePhoto ? <ShieldCheck size={16} className="text-emerald-500" /> : <ShieldAlert size={16} className="text-brand-outline-variant" />}
              </div>
              <FileUpload label="Upload Headshot" currentImage={brandKit.profilePhoto}
                onFileSelect={handleImageUpload('profilePhoto')} onClear={() => update('profilePhoto', null)} />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-brand-outline-variant bg-gradient-to-r from-brand-surface-container-high to-brand-surface-container-high">
          <Button onClick={onSave} className="w-full h-10 text-sm">
            <Save size={16} className="mr-2" /> Save Brand Kit
          </Button>
        </div>
      </div>
    </>
  );
};
