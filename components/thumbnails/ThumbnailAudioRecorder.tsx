import React, { useState, useRef } from 'react';
import { transcribeAudio } from '../../services/thumbnail/thumbnailGenService';
import { Mic, Square, Loader2 } from 'lucide-react';

interface ThumbnailAudioRecorderProps {
  onTranscription: (text: string) => void;
  isProcessing: boolean;
}

export const ThumbnailAudioRecorder: React.FC<ThumbnailAudioRecorderProps> = ({ onTranscription, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(audioBlob);
          onTranscription(text);
        } catch (error) {
          console.error('Transcription failed', error);
        } finally {
          setIsTranscribing(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isProcessing || isTranscribing}
        onClick={isRecording ? stopRecording : startRecording}
        className={`p-2.5 rounded-xl transition-all duration-300 ${
          isRecording
            ? 'bg-gradient-to-r from-rose-500 to-brand-primary text-white animate-pulse shadow-lg shadow-rose-500/30'
            : 'bg-brand-surface-container text-brand-primary hover:bg-brand-outline-variant'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isRecording ? 'Stop Recording' : 'Record Prompt'}
      >
        {isTranscribing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isRecording ? (
          <Square size={18} />
        ) : (
          <Mic size={18} />
        )}
      </button>
      {isRecording && <span className="text-xs font-semibold text-rose-500 animate-pulse">Recording...</span>}
      {isTranscribing && <span className="text-xs font-semibold text-brand-primary">Transcribing...</span>}
    </div>
  );
};
