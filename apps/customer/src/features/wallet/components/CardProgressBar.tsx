"use client";

type CardProgressBarProps = {
  current: number;
  target: number;
  ariaLabel: string;
};

export function CardProgressBar({
  current,
  target,
  ariaLabel,
}: CardProgressBarProps) {
  const progress =
    target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;

  return (
    <div className="space-y-1.5">
      <div
        className="h-2 overflow-hidden rounded-full bg-white/20"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={ariaLabel}
      >
        <div
          className="card-progress-shimmer relative h-full rounded-full bg-white transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
