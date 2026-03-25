import React from 'react';

interface CharCounterProps {
  current: number;
  max: number;
  className?: string;
}

export const CharCounter: React.FC<CharCounterProps> = ({ current, max, className = '' }) => {
  const percentage = (current / max) * 100;
  const isOver = current > max;
  const isNear = percentage > 80 && !isOver;

  return (
    <span
      className={`text-xs font-semibold ${
        isOver ? 'text-rose-400' : isNear ? 'text-amber-600' : 'text-brand-on-surface-variant'
      } ${className}`}
    >
      {current.toLocaleString()}/{max.toLocaleString()}
    </span>
  );
};
