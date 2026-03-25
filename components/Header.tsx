import React from 'react';
import { Zap, Menu, Settings, LogOut } from 'lucide-react';

export type AppTab = 'rebrand' | 'youtube' | 'linkedin' | 'thumbnails';

interface HeaderProps {
  onToggleSidebar?: () => void;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onAdminClick?: () => void;
  onSignOut?: () => void;
  isAdmin?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, activeTab, onTabChange, onAdminClick, onSignOut, isAdmin }) => {
  return (
    <header className="flex-shrink-0 z-10 bg-brand-surface-container-highest/60 backdrop-blur-[20px] shadow-none relative">
      <div className="h-16 sm:h-20 flex items-center px-4 sm:px-8 justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-xl hover:bg-brand-surface-container-high text-brand-on-surface transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu size={22} />
            </button>
          )}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-primary-container rounded-xl sm:rounded-2xl blur opacity-20"></div>
            <div className="relative bg-gradient-to-r from-brand-primary to-brand-primary-container p-2 sm:p-2.5 rounded-xl sm:rounded-2xl">
              <Zap className="text-white h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-2xl font-bold tracking-tight text-brand-on-surface" style={{ letterSpacing: '-0.02em' }}>
              Personal Agent
            </span>
            <span className="hidden sm:block text-[10px] font-medium text-brand-on-surface-variant uppercase tracking-wider">Automation Studio</span>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex px-4 py-2 rounded-full bg-brand-surface-container-high items-center gap-2">
            <span className="animate-pulse text-xl">✨</span>
            <span className="text-xs font-semibold text-brand-on-surface-variant">Powered by Gemini</span>
          </div>
          {isAdmin && onAdminClick && (
            <button
              onClick={onAdminClick}
              className="p-2 rounded-xl hover:bg-brand-surface-container-high text-brand-on-surface-variant hover:text-brand-primary transition-colors"
              title="Admin Dashboard"
            >
              <Settings size={18} />
            </button>
          )}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-xl hover:bg-brand-surface-container-high text-brand-on-surface-variant hover:text-red-400 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex px-4 sm:px-8 gap-1">
        <button
          onClick={() => onTabChange('rebrand')}
          className={`px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-t-xl transition-all relative ${
            activeTab === 'rebrand'
              ? 'text-brand-primary bg-brand-surface-container-highest -mb-px z-10'
              : 'text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-surface-container-high'
          }`}
        >
          Rebrand
        </button>
        <button
          onClick={() => onTabChange('youtube')}
          className={`px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-t-xl transition-all relative ${
            activeTab === 'youtube'
              ? 'text-brand-primary bg-brand-surface-container-highest -mb-px z-10'
              : 'text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-surface-container-high'
          }`}
        >
          YouTube Studio
        </button>
        <button
          onClick={() => onTabChange('linkedin')}
          className={`px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-t-xl transition-all relative ${
            activeTab === 'linkedin'
              ? 'text-brand-primary bg-brand-surface-container-highest -mb-px z-10'
              : 'text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-surface-container-high'
          }`}
        >
          LinkedIn Studio
        </button>
        <button
          onClick={() => onTabChange('thumbnails')}
          className={`px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-t-xl transition-all relative ${
            activeTab === 'thumbnails'
              ? 'text-brand-primary bg-brand-surface-container-highest -mb-px z-10'
              : 'text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-surface-container-high'
          }`}
        >
          Thumbnails
        </button>
      </div>
    </header>
  );
};
