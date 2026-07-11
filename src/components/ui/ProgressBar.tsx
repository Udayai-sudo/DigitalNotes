import clsx from 'clsx';
import { brandColors } from '../../config/theme';

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={clsx('h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-zinc-700', className)}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${clamped}%`,
          background: `linear-gradient(90deg, ${brandColors.goldMuted}, ${brandColors.goldLight})`,
        }}
      />
    </div>
  );
}
