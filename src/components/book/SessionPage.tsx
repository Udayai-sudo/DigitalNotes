import clsx from 'clsx';
import { brand, brandColors, themeConfig } from '../../config/theme';
import type { FlatPage, ThemeMode } from '../../types/book';

interface SessionPageProps {
  page: FlatPage;
  theme: ThemeMode;
  bookTitle?: string;
  onEndSession?: () => void;
}

export function SessionPage({ page, theme, bookTitle, onEndSession }: SessionPageProps) {
  const colors = themeConfig[theme];
  const label = page.sessionLabel ?? 'Day-01 Session';

  if (page.kind === 'session-start') {
    return (
      <div
        className={clsx('flex h-full w-full flex-col items-center justify-center p-8 text-center', colors.paper)}
      >
        <img
          src={brand.logo}
          alt={brand.name}
          className="mb-8 h-14 w-auto max-w-[240px] object-contain md:h-16"
        />
        <h2 className="font-serif text-3xl font-bold text-stone-800 dark:text-white md:text-4xl">
          {label}
        </h2>
        {bookTitle && (
          <p className="mt-3 max-w-xs text-sm text-stone-500 dark:text-zinc-400">{bookTitle}</p>
        )}
        <div className="mx-auto mt-6 h-px w-16" style={{ background: brandColors.gold }} />
        <p className="mt-6 text-sm text-stone-400">Turn the page to begin reading</p>
      </div>
    );
  }

  return (
    <div
      className={clsx('flex h-full w-full flex-col items-center justify-center p-8 text-center', colors.paper)}
    >
      <img
        src={brand.logo}
        alt={brand.name}
        className="mb-6 h-10 w-auto max-w-[200px] object-contain opacity-90 md:h-12"
      />
      <p className="text-xs font-semibold uppercase tracking-[0.35em]" style={{ color: brandColors.gold }}>
        {label}
      </p>
      <p className="mt-4 max-w-xs text-sm text-stone-500 dark:text-zinc-400">
        You have completed this session. Great work!
      </p>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEndSession?.();
        }}
        className="mt-8 rounded-xl px-8 py-3 text-sm font-semibold shadow-lg transition-opacity hover:opacity-90"
        style={{ background: brandColors.gold, color: brandColors.textOnGold }}
      >
        End Session
      </button>
    </div>
  );
}
