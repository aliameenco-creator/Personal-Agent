import React from 'react';
import { Film, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../Button';
import { ScenePreview } from './ScenePreview';
import { SRTScene } from '../../types/youtube';

interface VideoHookGeneratorProps {
  srtText: string;
  parsedScenes: SRTScene[];
  veoModel: 'standard' | 'fast';
  isLoading: boolean;
  error: string | null;
  onSrtChange: (text: string) => void;
  onParseSrt: () => void;
  onGenerate: () => void;
  onModelChange: (model: 'standard' | 'fast') => void;
  onDownloadScene: (scene: SRTScene) => void;
  onBack: () => void;
}

export const VideoHookGenerator: React.FC<VideoHookGeneratorProps> = ({
  srtText,
  parsedScenes,
  veoModel,
  isLoading,
  error,
  onSrtChange,
  onParseSrt,
  onGenerate,
  onModelChange,
  onDownloadScene,
  onBack,
}) => {
  const totalDuration = parsedScenes.length > 0
    ? parsedScenes[parsedScenes.length - 1].end - parsedScenes[0].start
    : 0;
  const completedScenes = parsedScenes.filter(s => s.status === 'completed').length;
  const isGenerating = parsedScenes.some(s => ['generating-prompt', 'generating-video', 'polling'].includes(s.status));

  return (
    <div className="space-y-6">
      {/* SRT Input */}
      <div className="card-bright rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Film size={20} className="text-brand-primary" />
          <h3 className="text-lg font-bold font-display gradient-text">Video Hook Generator</h3>
        </div>
        <p className="text-xs text-brand-on-surface-variant">
          Paste your SRT script for the intro (15-30 seconds). The system will generate motion graphics background clips
          for each scene, matched to your script. No voiceover, no people — just relevant visuals.
        </p>

        <textarea
          value={srtText}
          onChange={e => onSrtChange(e.target.value)}
          placeholder={`Paste your SRT script here. Example:\n\n1\n00:00:00,000 --> 00:00:04,000\nEver wondered why 90% of startups fail?\n\n2\n00:00:04,000 --> 00:00:08,000\nThe answer might surprise you...`}
          className="w-full px-5 py-4 bg-brand-surface-container-high border-2 border-brand-outline-variant rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-brand-on-surface placeholder:text-brand-on-surface-variant resize-y min-h-[160px] h-48 text-sm font-mono"
        />

        <div className="flex items-center gap-3">
          <Button
            onClick={onParseSrt}
            disabled={!srtText.trim()}
            variant="outline"
            className="h-10 px-6 font-semibold text-sm"
          >
            Parse SRT
          </Button>

          {parsedScenes.length > 0 && (
            <span className="text-xs text-brand-on-surface-variant">
              {parsedScenes.length} scene{parsedScenes.length !== 1 ? 's' : ''} — {totalDuration.toFixed(1)}s total
            </span>
          )}
        </div>
      </div>

      {/* Parsed Scenes */}
      {parsedScenes.length > 0 && (
        <div className="card-bright rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-on-surface uppercase tracking-wider">
              Scenes ({completedScenes}/{parsedScenes.length} done)
            </h3>
            <div className="flex items-center gap-3">
              {/* Model selector */}
              <div className="flex items-center gap-1 bg-brand-surface-container rounded-lg p-1">
                <button
                  onClick={() => onModelChange('fast')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    veoModel === 'fast'
                      ? 'bg-brand-surface-container-highest text-brand-primary shadow-sm'
                      : 'text-brand-on-surface-variant hover:text-brand-on-surface'
                  }`}
                >
                  Fast (~$0.15/s)
                </button>
                <button
                  onClick={() => onModelChange('standard')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    veoModel === 'standard'
                      ? 'bg-brand-surface-container-highest text-brand-primary shadow-sm'
                      : 'text-brand-on-surface-variant hover:text-brand-on-surface'
                  }`}
                >
                  HQ (~$0.40/s)
                </button>
              </div>
            </div>
          </div>

          {/* Scene list */}
          <div className="space-y-3">
            {parsedScenes.map(scene => (
              <ScenePreview key={scene.id} scene={scene} onDownload={onDownloadScene} />
            ))}
          </div>

          {/* Cost estimate */}
          <div className="text-xs text-brand-on-surface-variant bg-brand-surface-container-low px-4 py-2 rounded-lg">
            Estimated cost: ~${(totalDuration * (veoModel === 'fast' ? 0.15 : 0.40)).toFixed(2)} for {totalDuration.toFixed(1)}s of video
          </div>

          {/* Generate button */}
          <Button
            onClick={onGenerate}
            disabled={isLoading || isGenerating}
            isLoading={isLoading || isGenerating}
            className="h-12 px-8 font-semibold w-full"
          >
            <span className="flex items-center gap-2">
              {isGenerating ? 'Generating...' : 'Generate All Clips'} <Sparkles size={16} className={isLoading || isGenerating ? 'hidden' : ''} />
            </span>
          </Button>

          {error && (
            <div className="bg-rose-900/30 border border-rose-200 text-rose-400 text-sm px-4 py-3 rounded-xl">{error}</div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-start">
        <Button onClick={onBack} variant="outline" className="px-6 py-3 font-semibold">
          ← Back: Thumbnail
        </Button>
      </div>
    </div>
  );
};
