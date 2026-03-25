import React from 'react';
import { Download, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { SRTScene } from '../../types/youtube';

interface ScenePreviewProps {
  scene: SRTScene;
  onDownload: (scene: SRTScene) => void;
}

export const ScenePreview: React.FC<ScenePreviewProps> = ({ scene, onDownload }) => {
  const duration = (scene.end - scene.start).toFixed(1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.round((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const statusIcon = {
    pending: <Clock size={14} className="text-brand-on-surface-variant" />,
    'generating-prompt': <Loader2 size={14} className="animate-spin text-brand-primary" />,
    'generating-video': <Loader2 size={14} className="animate-spin text-brand-primary" />,
    polling: <Loader2 size={14} className="animate-spin text-brand-primary" />,
    completed: <CheckCircle size={14} className="text-emerald-500" />,
    error: <AlertCircle size={14} className="text-rose-500" />,
  };

  const statusText = {
    pending: 'Waiting',
    'generating-prompt': 'Creating prompt...',
    'generating-video': 'Generating video...',
    polling: 'Processing...',
    completed: 'Done',
    error: 'Failed',
  };

  return (
    <div className={`border rounded-xl p-4 space-y-2 transition-all ${
      scene.status === 'completed' ? 'border-emerald-200 bg-emerald-900/30/50' :
      scene.status === 'error' ? 'border-rose-200 bg-rose-900/30/50' :
      scene.status === 'pending' ? 'border-brand-outline-variant' :
      'border-brand-outline-variant bg-brand-surface-container-high/50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-brand-on-surface-variant bg-brand-surface-container px-2 py-0.5 rounded">
            Scene {scene.index + 1}
          </span>
          <span className="text-xs text-brand-on-surface-variant">
            {formatTime(scene.start)} → {formatTime(scene.end)} ({duration}s)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {statusIcon[scene.status]}
          <span>{statusText[scene.status]}</span>
        </div>
      </div>

      {/* Script text */}
      <p className="text-sm text-brand-on-surface font-medium bg-brand-surface-container/80 px-3 py-2 rounded-lg border border-gray-100">
        "{scene.text}"
      </p>

      {/* Generated prompt */}
      {scene.prompt && (
        <div className="text-xs text-brand-primary bg-brand-surface-container-high px-3 py-2 rounded-lg border border-brand-surface-container">
          <span className="font-bold">Visual prompt: </span>
          {scene.prompt}
        </div>
      )}

      {/* Error message */}
      {scene.errorMessage && (
        <div className="text-xs text-rose-400 bg-rose-900/30 px-3 py-2 rounded-lg border border-rose-100">
          {scene.errorMessage}
        </div>
      )}

      {/* Download button */}
      {scene.status === 'completed' && scene.videoUrl && (
        <button
          onClick={() => onDownload(scene)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-brand-primary to-brand-primary px-4 py-2 rounded-lg hover:shadow-lg transition-all"
        >
          <Download size={14} /> Download Clip
        </button>
      )}
    </div>
  );
};
