import type { CSSProperties } from 'react';

export function ProgressBar({
  value,
  max,
  label,
  tone,
  className,
}: {
  value: number;
  max: number;
  label?: string;
  tone?: string;
  className?: string;
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  return (
    <div
      className={`progress${className ? ` ${className}` : ''}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      style={tone ? ({ '--cat': tone } as CSSProperties) : undefined}
    >
      <span className="progress__fill" style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}
