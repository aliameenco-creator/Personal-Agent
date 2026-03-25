import React from 'react';
import { Mic, MicOff } from 'lucide-react';

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isListening,
  isSupported,
  onStart,
  onStop,
  className = '',
}) => {
  if (!isSupported) {
    return (
      <button
        disabled
        className={`p-2 rounded-xl text-brand-outline-variant cursor-not-allowed ${className}`}
        title="Speech-to-text not supported in this browser"
      >
        <MicOff size={18} />
      </button>
    );
  }

  return (
    <button
      onClick={isListening ? onStop : onStart}
      className={`p-2 rounded-xl transition-all ${
        isListening
          ? 'bg-rose-900/40 text-rose-400 hover:bg-rose-200 animate-pulse'
          : 'text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-surface-container-high'
      } ${className}`}
      title={isListening ? 'Stop recording' : 'Start voice input'}
    >
      <Mic size={18} />
    </button>
  );
};
