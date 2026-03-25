import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, label, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-all ${
        copied
          ? 'text-emerald-400 bg-emerald-900/30 border-emerald-200'
          : 'text-brand-on-surface-variant hover:text-brand-primary hover:bg-brand-surface-container-high border-brand-outline-variant'
      } border px-3 py-1.5 rounded-lg ${className}`}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {label || (copied ? 'Copied!' : 'Copy')}
    </button>
  );
};
