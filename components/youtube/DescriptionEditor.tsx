import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../Button';
import { KeyPhraseInput } from './KeyPhraseInput';
import { KeyPhraseHighlighter } from './KeyPhraseHighlighter';
import { HighlightedDescription } from './HighlightedDescription';
import { CharCounter } from '../shared/CharCounter';
import { CopyButton } from '../shared/CopyButton';
import { KeyPhrase } from '../../types/youtube';

interface DescriptionEditorProps {
  title: string;
  topic: string;
  keyPhrases: KeyPhrase[];
  generatedDescription: string;
  editedDescription: string;
  isLoading: boolean;
  error: string | null;
  onAddPhrases: (phrases: KeyPhrase[]) => void;
  onRemovePhrase: (id: string) => void;
  onGenerate: () => void;
  onEditDescription: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DescriptionEditor: React.FC<DescriptionEditorProps> = ({
  title,
  topic,
  keyPhrases,
  generatedDescription,
  editedDescription,
  isLoading,
  error,
  onAddPhrases,
  onRemovePhrase,
  onGenerate,
  onEditDescription,
  onNext,
  onBack,
}) => {
  return (
    <div className="space-y-6">
      {/* Key Phrase Input */}
      <div className="card-bright rounded-2xl p-6">
        <KeyPhraseInput keyPhrases={keyPhrases} onAdd={onAddPhrases} onRemove={onRemovePhrase} />
      </div>

      {/* Generate Button */}
      <div className="card-bright rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-display gradient-text">Generate Description</h3>
            <p className="text-xs text-brand-on-surface-variant mt-1">
              Title: <strong>{title || 'Not set'}</strong>
              {keyPhrases.length > 0 && (
                <span> — {keyPhrases.length} key phrase{keyPhrases.length !== 1 ? 's' : ''} will be inserted exactly</span>
              )}
            </p>
          </div>
          <Button
            onClick={onGenerate}
            disabled={!title || isLoading}
            isLoading={isLoading}
            className="h-10 px-6 font-semibold text-sm"
          >
            <span className="flex items-center gap-2">
              Generate <Sparkles size={14} className={isLoading ? 'hidden' : ''} />
            </span>
          </Button>
        </div>

        {error && (
          <div className="bg-rose-900/30 border border-rose-200 text-rose-400 text-sm px-4 py-3 rounded-xl">{error}</div>
        )}
      </div>

      {/* Description Text Area */}
      {(generatedDescription || editedDescription) && (
        <div className="card-bright rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-on-surface uppercase tracking-wider">Description</h3>
            <div className="flex items-center gap-3">
              <CharCounter current={editedDescription.length} max={5000} />
              <CopyButton text={editedDescription} />
            </div>
          </div>

          <HighlightedDescription
            value={editedDescription}
            phrases={keyPhrases.map(kp => kp.text)}
            onChange={onEditDescription}
          />

          {/* Key Phrase Verification */}
          <KeyPhraseHighlighter description={editedDescription} phrases={keyPhrases.map(kp => kp.text)} />
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" className="px-6 py-3 font-semibold">
          ← Back: Title
        </Button>
        {editedDescription && (
          <Button onClick={onNext} variant="secondary" className="px-6 py-3 font-semibold">
            Next: Tags →
          </Button>
        )}
      </div>
    </div>
  );
};
