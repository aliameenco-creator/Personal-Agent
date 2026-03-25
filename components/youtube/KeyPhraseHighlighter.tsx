import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface KeyPhraseHighlighterProps {
  description: string;
  phrases: string[];
}

/**
 * Shows a checklist of key phrases and whether each one appears in the description.
 */
export const KeyPhraseHighlighter: React.FC<KeyPhraseHighlighterProps> = ({ description, phrases }) => {
  if (phrases.length === 0) return null;

  const results = phrases.map(phrase => ({
    phrase,
    found: description.includes(phrase),
  }));

  const allFound = results.every(r => r.found);
  const foundCount = results.filter(r => r.found).length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-on-surface-variant uppercase tracking-wider">Key Phrase Check</span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            allFound ? 'bg-emerald-900/40 text-emerald-400' : 'bg-amber-900/40 text-amber-400'
          }`}
        >
          {foundCount}/{phrases.length} found
        </span>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {results.map((r, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${
              r.found ? 'bg-emerald-900/30 text-emerald-400' : 'bg-rose-900/30 text-rose-400'
            }`}
          >
            {r.found ? <Check size={14} className="flex-shrink-0" /> : <AlertCircle size={14} className="flex-shrink-0" />}
            <span className="font-medium truncate">{r.phrase}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
