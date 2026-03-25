import React, { useState } from 'react';
import { Sparkles, Check, Lightbulb, Loader2 } from 'lucide-react';
import { Button } from '../Button';
import { VoiceInputButton } from '../shared/VoiceInputButton';

interface TitleGeneratorProps {
  videoTopic: string;
  generatedTitles: string[];
  selectedTitle: string;
  thumbnailIdea: string;
  isLoading: boolean;
  error: string | null;
  onTopicChange: (topic: string) => void;
  onGenerate: (topic: string) => void;
  onSelectTitle: (title: string) => void;
  onNext: () => void;
  // Speech
  isListening: boolean;
  isSpeechSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  interimText: string;
}

export const TitleGenerator: React.FC<TitleGeneratorProps> = ({
  videoTopic,
  generatedTitles,
  selectedTitle,
  thumbnailIdea,
  isLoading,
  error,
  onTopicChange,
  onGenerate,
  onSelectTitle,
  onNext,
  isListening,
  isSpeechSupported,
  onStartListening,
  onStopListening,
  interimText,
}) => {
  return (
    <div className="space-y-6">
      {/* Topic Input */}
      <div className="card-bright rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-brand-primary" />
          <h3 className="text-lg font-bold font-display gradient-text">What's your video about?</h3>
        </div>

        <div className="relative">
          <textarea
            value={videoTopic}
            onChange={e => onTopicChange(e.target.value)}
            placeholder="Describe your video topic, e.g. 'How to grow a YouTube channel from 0 to 10K subscribers in 2026'..."
            className="w-full px-5 py-4 pr-20 bg-brand-surface-container-high border-2 border-brand-outline-variant rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-brand-on-surface placeholder-brand-outline-variant resize-none h-24 transition-all font-medium"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey && videoTopic.trim()) {
                e.preventDefault();
                onGenerate(videoTopic);
              }
            }}
          />
          {interimText && (
            <div className="absolute left-5 bottom-3 text-sm text-brand-primary italic">{interimText}...</div>
          )}
          <div className="absolute right-3 top-3 flex items-center gap-1">
            <VoiceInputButton
              isListening={isListening}
              isSupported={isSpeechSupported}
              onStart={onStartListening}
              onStop={onStopListening}
            />
          </div>
        </div>

        <Button
          onClick={() => onGenerate(videoTopic)}
          disabled={!videoTopic.trim() || isLoading}
          isLoading={isLoading}
          className="h-12 px-8 font-semibold"
        >
          <span className="flex items-center gap-2">
            Generate Titles <Sparkles size={16} className={isLoading ? 'hidden' : ''} />
          </span>
        </Button>

        {error && (
          <div className="bg-rose-900/30 border border-rose-200 text-rose-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}
      </div>

      {/* Generated Titles */}
      {generatedTitles.length > 0 && (
        <div className="card-bright rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold font-display text-brand-on-surface">Pick a title</h3>

          <div className="space-y-2">
            {generatedTitles.map((title, i) => (
              <button
                key={i}
                onClick={() => onSelectTitle(title)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                  selectedTitle === title
                    ? 'border-brand-primary bg-brand-surface-container-high shadow-md'
                    : 'border-brand-outline-variant hover:border-brand-outline-variant hover:bg-brand-surface-container-high/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      selectedTitle === title ? 'border-brand-primary bg-brand-primary' : 'border-brand-outline-variant'
                    }`}
                  >
                    {selectedTitle === title && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-medium text-brand-on-surface">{title}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Editable selected title */}
          {selectedTitle && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-primary uppercase tracking-wider">Selected title (editable)</label>
              <input
                type="text"
                value={selectedTitle}
                onChange={e => onSelectTitle(e.target.value)}
                className="w-full px-4 py-3 bg-brand-surface-container-high border-2 border-brand-outline-variant rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary font-semibold text-brand-on-surface"
              />
              <div className="text-xs text-brand-on-surface-variant text-right">{selectedTitle.length}/70 characters</div>
            </div>
          )}
        </div>
      )}

      {/* Thumbnail Idea */}
      {thumbnailIdea && (
        <div className="card-bright rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold font-display text-brand-on-surface">Thumbnail Idea</h3>
          </div>
          <p className="text-brand-on-surface-variant text-sm leading-relaxed bg-amber-900/30 border border-amber-200 rounded-xl px-4 py-3">
            {thumbnailIdea}
          </p>
        </div>
      )}

      {/* Next button */}
      {selectedTitle && (
        <div className="flex justify-end">
          <Button onClick={onNext} variant="secondary" className="px-6 py-3 font-semibold">
            Next: Description →
          </Button>
        </div>
      )}
    </div>
  );
};
