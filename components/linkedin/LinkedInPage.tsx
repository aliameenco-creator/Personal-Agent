import React, { useState, useEffect, useCallback } from 'react';
import { useLinkedInWorkflow } from '../../hooks/useLinkedInWorkflow';
import { LinkedInBrandKit } from '../../types/linkedin';
import { getBrandKit, saveBrandKit, createDefaultBrandKit } from '../../services/linkedin/brandKitService';
import { BrandKitPanel } from './BrandKitPanel';
import { PostTypeSelector } from './PostTypeSelector';
import { TopicInput } from './TopicInput';
import { SlideEditor } from './SlideEditor';
import { SlidePreview } from './SlidePreview';
import { DownloadPanel } from './DownloadPanel';
import { Button } from '../Button';
import { Sparkles, Settings, Menu, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';

interface LinkedInPageProps {
  onToggleSidebar: () => void;
}

export const LinkedInPage: React.FC<LinkedInPageProps> = ({ onToggleSidebar }) => {
  const { state, dispatch, generateContent, generateVisuals, regenerateSlide, editSlide, goToPhase, reset } = useLinkedInWorkflow();
  const [brandKit, setBrandKit] = useState<LinkedInBrandKit>(() => getBrandKit() || createDefaultBrandKit());
  const [sidebarOpen, setSidebarOpen] = useState(() => !getBrandKit());
  const [useBrandKit, setUseBrandKit] = useState(true);
  const { project, loading, errors, generatingSlideIndex } = state;

  const activeBrandKit = useBrandKit ? brandKit : createDefaultBrandKit();

  // Sync brand kit to hook state
  useEffect(() => {
    dispatch({ type: 'SET_BRAND_KIT', payload: useBrandKit ? brandKit : null });
  }, [brandKit, useBrandKit, dispatch]);

  const handleSaveBrandKit = useCallback(() => {
    saveBrandKit(brandKit);
    setSidebarOpen(false);
  }, [brandKit]);

  const handleGenerateContent = useCallback(async () => {
    await generateContent(activeBrandKit);
  }, [generateContent, activeBrandKit]);

  const handleGenerateVisuals = useCallback(async () => {
    await generateVisuals(activeBrandKit);
  }, [generateVisuals, activeBrandKit]);

  const handleRegenerateSlide = useCallback(async (slideId: string) => {
    await regenerateSlide(slideId, activeBrandKit);
  }, [regenerateSlide, activeBrandKit]);

  const handleEditSlide = useCallback(async (slideId: string, message: string) => {
    await editSlide(slideId, message);
  }, [editSlide]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  const canGenerate = project.topic.trim().length > 0 && (!useBrandKit || brandKit.brandName.trim().length > 0);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* Brand Kit Sidebar */}
      {useBrandKit && (
        <BrandKitPanel
          brandKit={brandKit}
          onChange={setBrandKit}
          onSave={handleSaveBrandKit}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex-shrink-0 px-4 sm:px-8 py-3 border-b border-brand-surface-container bg-white/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-xl hover:bg-brand-surface-container-high text-brand-primary transition-colors">
              <Menu size={20} />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-brand-on-surface">LinkedIn Post Generator</h2>
            {project.currentPhase !== 'setup' && (
              <span className="text-[10px] bg-brand-surface-container text-brand-primary px-2 py-0.5 rounded-full font-bold uppercase">
                {project.currentPhase}
              </span>
            )}
          </div>
          {useBrandKit && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-primary bg-brand-surface-container-high rounded-lg hover:bg-brand-surface-container transition-colors"
            >
              <Settings size={14} /> Brand Kit
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8">

            {/* Setup Phase */}
            {project.currentPhase === 'setup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-brand-on-surface mb-1">Create a LinkedIn Post</h3>
                  <p className="text-sm text-brand-primary">Choose your post type, enter a topic, and let AI do the rest.</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm text-brand-on-surface font-semibold">Post Type</label>
                  <PostTypeSelector
                    postType={project.postType}
                    onChange={type => dispatch({ type: 'SET_POST_TYPE', payload: type })}
                  />
                </div>

                {project.postType === 'carousel' && (
                  <div className="space-y-2">
                    <label className="block text-sm text-brand-on-surface font-semibold">
                      Number of Slides: <span className="text-brand-primary">{project.slideCount}</span>
                    </label>
                    <input
                      type="range"
                      min={2}
                      max={10}
                      value={project.slideCount}
                      onChange={e => dispatch({ type: 'SET_SLIDE_COUNT', payload: parseInt(e.target.value) })}
                      className="w-full h-2 bg-brand-outline-variant rounded-full appearance-none cursor-pointer accent-brand-primary"
                    />
                    <div className="flex justify-between text-[10px] text-brand-primary font-semibold">
                      <span>2</span><span>4</span><span>6</span><span>8</span><span>10</span>
                    </div>
                  </div>
                )}

                <TopicInput
                  topic={project.topic}
                  onTopicChange={topic => dispatch({ type: 'SET_TOPIC', payload: topic })}
                  referencePost={project.referencePost}
                  onReferenceChange={ref => dispatch({ type: 'SET_REFERENCE_POST', payload: ref })}
                />

                {/* Brand Kit Toggle */}
                <div className="card-bright p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-brand-on-surface">Use Brand Kit</span>
                    <p className="text-[10px] text-brand-primary mt-0.5">
                      {useBrandKit ? 'Brand colors, logos, and identity will be applied.' : 'Generate without any branding.'}
                    </p>
                  </div>
                  <button onClick={() => setUseBrandKit(!useBrandKit)} className="text-brand-primary hover:text-brand-primary transition-colors">
                    {useBrandKit ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-brand-on-surface-variant" />}
                  </button>
                </div>

                {/* Errors */}
                {errors.content && (
                  <div className="flex items-center gap-2 p-3 bg-rose-900/30 border border-rose-200 rounded-xl text-sm text-rose-400">
                    <AlertCircle size={16} /> {errors.content}
                  </div>
                )}

                {/* Brand kit warning */}
                {useBrandKit && !brandKit.brandName.trim() && (
                  <div className="flex items-center gap-2 p-3 bg-amber-900/30 border border-amber-200 rounded-xl text-sm text-amber-400">
                    <AlertCircle size={16} /> Please set up your brand name in the Brand Kit first.
                  </div>
                )}

                <Button
                  onClick={handleGenerateContent}
                  disabled={!canGenerate}
                  isLoading={loading.content}
                  className="w-full h-12 text-sm"
                >
                  <Sparkles size={16} className="mr-2" /> Generate Content
                </Button>
              </div>
            )}

            {/* Content Phase */}
            {project.currentPhase === 'content' && (
              <SlideEditor
                slides={project.slideContents}
                onUpdateSlide={(id, updates) => dispatch({ type: 'UPDATE_SLIDE_CONTENT', payload: { id, updates } })}
                onReorder={slides => dispatch({ type: 'REORDER_SLIDES', payload: slides })}
                onGenerate={handleGenerateVisuals}
                onBack={() => goToPhase('setup')}
                isLoading={loading.generation}
              />
            )}

            {/* Generation Phase */}
            {project.currentPhase === 'generation' && (
              <SlidePreview
                slides={project.generatedSlides}
                generatingIndex={generatingSlideIndex}
                onRegenerate={handleRegenerateSlide}
                onEditSlide={handleEditSlide}
                onBack={() => goToPhase('content')}
                onNext={() => goToPhase('download')}
                isLoading={loading.generation}
              />
            )}

            {/* Download Phase */}
            {project.currentPhase === 'download' && (
              <DownloadPanel
                slides={project.generatedSlides}
                postType={project.postType}
                topic={project.topic}
                onBack={() => goToPhase('generation')}
                onReset={handleReset}
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
