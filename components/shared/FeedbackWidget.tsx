import React, { useState } from 'react';
import { Star, Send, X, Loader2 } from 'lucide-react';
import { submitFeedback, SystemName } from '../../services/feedbackService';

interface FeedbackWidgetProps {
  system: SystemName;
  metadata?: Record<string, any>;
  onClose?: () => void;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ system, metadata, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await submitFeedback({ system, rating, comment: comment || undefined, metadata });
      setSubmitted(true);
      setTimeout(() => onClose?.(), 1500);
    } catch {
      // Silently fail — feedback is non-critical
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-brand-surface-container rounded-xl p-4 text-center">
        <p className="text-brand-tertiary text-sm font-medium">Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-surface-container rounded-xl p-4 border border-brand-outline-variant">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-brand-on-surface">Rate this result</p>
        {onClose && (
          <button onClick={onClose} className="text-brand-on-surface-variant hover:text-brand-on-surface">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={24}
              className={
                n <= (hoverRating || rating)
                  ? 'fill-brand-primary text-brand-primary'
                  : 'text-brand-outline-variant'
              }
            />
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What could be better? (optional)"
        className="w-full px-3 py-2 rounded-lg bg-brand-surface-container-low border border-brand-outline-variant text-brand-on-surface text-sm placeholder:text-brand-on-surface-variant focus:outline-none focus:border-brand-primary resize-none"
        rows={2}
      />

      <button
        onClick={handleSubmit}
        disabled={rating === 0 || loading}
        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-brand-primary text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {loading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
        Submit Feedback
      </button>
    </div>
  );
};
