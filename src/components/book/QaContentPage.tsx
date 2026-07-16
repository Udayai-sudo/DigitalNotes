import clsx from 'clsx';
import { brand, brandColors, themeConfig } from '../../config/theme';
import type { FlatPage, ThemeMode } from '../../types/book';

interface QaContentPageProps {
  page: FlatPage;
  theme: ThemeMode;
  bookTitle?: string;
}

/**
 * One FlipBook page showing exactly (up to) two Q&As — centered, clear, neat.
 */
export function QaContentPage({ page, theme, bookTitle }: QaContentPageProps) {
  const colors = themeConfig[theme];
  const items = page.qaItems ?? [];
  const title = bookTitle || page.chapterTitle;
  const pageLabel = page.contentPageTotal
    ? `${page.pageInChapter}`
    : String(page.pageInChapter);

  return (
    <div
      className={clsx(
        'relative flex h-full w-full flex-col overflow-hidden',
        colors.paper,
        colors.text,
      )}
    >
      <header
        className={clsx(
          'relative z-10 flex shrink-0 items-center justify-between gap-4 border-b px-6 py-4 md:px-8',
          colors.paper,
          colors.paperBorder,
        )}
      >
        <img
          src={theme === 'dark' ? brand.logo : brand.logoOnLight}
          alt={brand.name}
          className="h-6 w-auto max-w-[140px] shrink-0 object-contain object-left opacity-90 md:h-7"
        />
        <p
          className="min-w-0 truncate text-right text-[11px] font-medium tracking-wide md:text-xs"
          style={{ color: brandColors.gold }}
        >
          {title}
        </p>
      </header>

      <div className="relative z-0 min-h-0 flex-1 overflow-y-auto px-6 py-5 md:px-10 md:py-6">
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center gap-8 md:gap-10">
          {items.map((item, index) => {
            const number = (page.pageInChapter - 1) * 2 + index + 1;
            return (
              <article key={`${page.pageInChapter}-${index}`} className="text-center">
                <p
                  className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em]"
                  style={{ color: brandColors.gold }}
                >
                  Question {number}
                </p>
                <h3 className="font-serif text-base font-bold leading-snug md:text-lg">{item.question}</h3>
                <div
                  className="mx-auto mt-2.5 mb-3 h-px w-10"
                  style={{ background: brandColors.gold }}
                />
                <p className={clsx('text-sm leading-relaxed md:text-[15px]', colors.muted)}>
                  {item.answer}
                </p>
              </article>
            );
          })}
        </div>
      </div>

      <footer
        className={clsx(
          'relative z-10 grid shrink-0 grid-cols-3 items-center gap-3 border-t px-6 py-3 text-[10px] md:px-8',
          colors.paper,
          colors.paperBorder,
          colors.muted,
        )}
      >
        <a href={`tel:${brand.contactPhone}`} className="justify-self-start hover:opacity-80">
          {brand.contactPhone}
        </a>
        <p
          className="justify-self-center font-medium tabular-nums"
          style={{ color: brandColors.gold }}
        >
          {pageLabel}
        </p>
        <span className="justify-self-end" aria-hidden />
      </footer>
    </div>
  );
}
