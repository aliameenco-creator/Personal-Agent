import React, { useCallback } from 'react';
import { useSvgCarouselWorkflow } from '../../hooks/useSvgCarouselWorkflow';
import { SvgSlidePreview } from './SvgSlidePreview';
import { SvgDownloadPanel } from './SvgDownloadPanel';
import { SystemPromptViewer } from './SystemPromptViewer';
import { Button } from '../Button';
import { Sparkles, Menu, AlertCircle, Lightbulb } from 'lucide-react';

interface LinkedInBusterPageProps {
  onToggleSidebar: () => void;
}

export const LinkedInBusterPage: React.FC<LinkedInBusterPageProps> = ({ onToggleSidebar }) => {
  const { state, dispatch, generateSlides, regenerateSlide, goToPhase, reset } = useSvgCarouselWorkflow();
  const { project, loading, error } = state;

  const canGenerate = project.topic.trim().length > 0;

  const handleGenerate = useCallback(async () => {
    await generateSlides();
  }, [generateSlides]);

  const handleRegenerate = useCallback(async (slideId: string) => {
    await regenerateSlide(slideId);
  }, [regenerateSlide]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex-shrink-0 px-4 sm:px-8 py-3 border-b border-brand-surface-container bg-brand-surface-container-high/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onToggleSidebar} className="lg:hidden p-2 rounded-xl hover:bg-brand-surface-container-high text-brand-primary transition-colors">
              <Menu size={20} />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-brand-on-surface">LinkedIn Buster</h2>
            <span className="text-[10px] bg-gradient-to-r from-amber-500/20 to-indigo-500/20 text-brand-primary px-2 py-0.5 rounded-full font-bold uppercase">
              SVG Carousel
            </span>
            {project.currentPhase !== 'setup' && (
              <span className="text-[10px] bg-brand-surface-container text-brand-primary px-2 py-0.5 rounded-full font-bold uppercase">
                {project.currentPhase}
              </span>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-8 py-6 sm:py-8">

            {/* Setup Phase */}
            {project.currentPhase === 'setup' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-brand-on-surface mb-1">LinkedIn Buster</h3>
                  <p className="text-sm text-brand-primary">
                    Generate professional SVG carousel slides for LinkedIn using the "Clean Tech" design system. All slides generated in parallel.
                  </p>
                </div>

                {/* System Prompt Viewer */}
                <SystemPromptViewer />

                {/* Slide Count */}
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

                {/* Topic Input */}
                <div>
                  <label className="block text-sm text-brand-on-surface font-semibold mb-2 flex items-center gap-2">
                    <Lightbulb size={16} className="text-brand-primary" /> What's your carousel about?
                  </label>
                  <textarea
                    value={project.topic}
                    onChange={e => dispatch({ type: 'SET_TOPIC', payload: e.target.value })}
                    placeholder="e.g. The shift from chatbots to autonomous agents, 5 MCP patterns every AI engineer needs, How agentic AI delivers 10x ROI..."
                    rows={3}
                    className="w-full px-4 py-3 text-sm border-2 border-brand-outline-variant rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary bg-brand-surface-container-highest text-brand-on-surface placeholder:text-brand-on-surface-variant font-medium transition-all resize-none"
                  />
                </div>

                {/* Design preview hint */}
                <div className="card-bright p-4 rounded-xl">
                  <p className="text-xs text-brand-primary font-semibold mb-2">Design Preview</p>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: '#e38c35' }} title="Primary: Copper/Amber" />
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: '#6e77cb' }} title="Secondary: Lavender/Indigo" />
                    <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: '#252525' }} title="Typography: Deep Charcoal" />
                    <div className="w-8 h-8 rounded-lg border border-brand-outline-variant" style={{ backgroundColor: '#e6e6e6' }} title="Background: Light Grey" />
                  </div>
                  <p className="text-[10px] text-brand-on-surface-variant mt-2">
                    680x860 canvas | Georgia headers | Full-bleed gradient | No watermarks
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-900/30 border border-rose-200 rounded-xl text-sm text-rose-400">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  isLoading={loading}
                  className="w-full h-12 text-sm"
                >
                  <Sparkles size={16} className="mr-2" /> Generate SVG Carousel
                </Button>
              </div>
            )}

            {/* Generation Phase */}
            {project.currentPhase === 'generation' && (
              <SvgSlidePreview
                slides={project.slides}
                onRegenerate={handleRegenerate}
                onBack={() => goToPhase('setup')}
                onNext={() => goToPhase('download')}
                isLoading={loading}
              />
            )}

            {/* Download Phase */}
            {project.currentPhase === 'download' && (
              <SvgDownloadPanel
                slides={project.slides}
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
