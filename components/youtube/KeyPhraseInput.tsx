import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { KeyPhrase } from '../../types/youtube';

interface KeyPhraseInputProps {
  keyPhrases: KeyPhrase[];
  onAdd: (phrases: KeyPhrase[]) => void;
  onRemove: (id: string) => void;
}

export const KeyPhraseInput: React.FC<KeyPhraseInputProps> = ({ keyPhrases, onAdd, onRemove }) => {
  const [inputText, setInputText] = useState('');

  const handleAddPhrases = () => {
    if (!inputText.trim()) return;

    // Split by newlines or commas to allow bulk paste from vidIQ
    const rawPhrases = inputText
      .split(/[\n,]+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    // Deduplicate against existing phrases
    const existingTexts = new Set(keyPhrases.map(kp => kp.text.toLowerCase()));
    const newPhrases: KeyPhrase[] = rawPhrases
      .filter(p => !existingTexts.has(p.toLowerCase()))
      .map(text => ({
        id: Math.random().toString(36).substr(2, 9),
        text, // EXACT text — never mutated
        used: false,
        source: 'vidiq' as const,
      }));

    if (newPhrases.length > 0) {
      onAdd(newPhrases);
    }
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddPhrases();
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-brand-primary uppercase tracking-wider flex items-center gap-2">
        Key Phrases from vidIQ
      </label>
      <p className="text-xs text-brand-on-surface-variant">
        Paste your key phrases from vidIQ (one per line or comma-separated). These will be inserted{' '}
        <strong>exactly as typed</strong> into the description.
      </p>

      <div className="flex gap-2">
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Paste key phrases here (one per line or comma-separated)..."
          className="flex-1 px-4 py-3 bg-brand-surface-container-high border-2 border-brand-outline-variant rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-brand-on-surface placeholder-brand-outline-variant resize-none h-20 text-sm font-medium"
        />
        <button
          onClick={handleAddPhrases}
          disabled={!inputText.trim()}
          className="px-4 self-end mb-1 h-10 bg-brand-primary hover:bg-brand-primary disabled:bg-gray-300 text-white rounded-xl transition-colors flex items-center gap-1.5 font-semibold text-sm"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Phrase chips */}
      {keyPhrases.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {keyPhrases.map(kp => (
            <div
              key={kp.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-surface-container border border-brand-outline-variant rounded-lg text-sm font-medium text-brand-primary-container group"
            >
              <span>"{kp.text}"</span>
              <button
                onClick={() => onRemove(kp.id)}
                className="text-brand-primary hover:text-rose-500 transition-colors opacity-60 group-hover:opacity-100"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {keyPhrases.length > 0 && (
        <div className="text-xs text-brand-on-surface-variant">{keyPhrases.length} phrase{keyPhrases.length !== 1 ? 's' : ''} added</div>
      )}
    </div>
  );
};
