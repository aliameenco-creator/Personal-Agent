import React, { useRef, useCallback, useEffect } from 'react';

interface HighlightedDescriptionProps {
  value: string;
  phrases: string[];
  onChange: (text: string) => void;
  className?: string;
}

/**
 * Editable description field that renders key phrases in bold.
 * Uses a visible div with highlighted HTML overlaying a hidden structure.
 */
export const HighlightedDescription: React.FC<HighlightedDescriptionProps> = ({
  value,
  phrases,
  onChange,
  className = '',
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const lastValueRef = useRef(value);

  const buildHighlightedHTML = useCallback(
    (text: string): string => {
      if (phrases.length === 0) {
        return escapeHTML(text).replace(/\n/g, '<br>');
      }

      // Sort phrases by length descending to match longest first
      const sortedPhrases = [...phrases].sort((a, b) => b.length - a.length);

      // Escape the text first
      const escaped = escapeHTML(text);

      // Build a regex that matches any of the phrases (escaped for regex + HTML)
      const phrasePatterns = sortedPhrases.map(p => escapeRegex(escapeHTML(p)));
      const regex = new RegExp(`(${phrasePatterns.join('|')})`, 'gi');

      return escaped
        .replace(regex, '<strong class="text-brand-primary font-bold">$1</strong>')
        .replace(/\n/g, '<br>');
    },
    [phrases]
  );

  // Sync HTML when value changes externally (e.g., after generation)
  useEffect(() => {
    if (divRef.current && value !== lastValueRef.current) {
      lastValueRef.current = value;
      const html = buildHighlightedHTML(value);
      divRef.current.innerHTML = html;
    }
  }, [value, buildHighlightedHTML]);

  // Also re-highlight when phrases change
  useEffect(() => {
    if (divRef.current) {
      const html = buildHighlightedHTML(value);
      divRef.current.innerHTML = html;
    }
  }, [phrases, buildHighlightedHTML, value]);

  const handleInput = useCallback(() => {
    if (divRef.current) {
      const text = extractText(divRef.current);
      lastValueRef.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    },
    []
  );

  return (
    <div
      ref={divRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onPaste={handlePaste}
      className={`w-full px-5 py-4 bg-brand-surface-container-high border-2 border-brand-outline-variant rounded-2xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-brand-on-surface resize-y min-h-[200px] h-64 overflow-y-auto text-sm font-medium leading-relaxed outline-none whitespace-pre-wrap ${className}`}
      dangerouslySetInnerHTML={{ __html: buildHighlightedHTML(value) }}
    />
  );
};

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extract plain text from a contentEditable div, preserving line breaks. */
function extractText(el: HTMLElement): string {
  let text = '';
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeName === 'BR') {
      text += '\n';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.nodeName;
      // Block-level elements get a newline before (except if first)
      if (tag === 'DIV' || tag === 'P') {
        if (text.length > 0 && !text.endsWith('\n')) {
          text += '\n';
        }
      }
      text += extractText(node as HTMLElement);
    }
  });
  return text;
}
