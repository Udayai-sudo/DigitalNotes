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
    <div className={clsx('relative flex h-full w-full flex-col', colors.paper, colors.text)}>
      <header className="flex shrink-0 items-center justify-between gap-3 px-7 pt-6 md:px-9 md:pt-7">
        <img
          src={theme === 'dark' ? brand.logo : brand.logoOnLight}
          alt={brand.name}
          className="h-7 w-auto max-w-[160px] object-contain opacity-90 md:h-8"
        />
        <p
          className="truncate text-right text-[11px] font-medium tracking-wide md:text-xs"
          style={{ color: brandColors.gold }}
        >
          {title}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 py-4 md:px-12">
        <div className="flex w-full max-w-md flex-col justify-center gap-10 md:gap-12">
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
                <h3 className="font-serif text-lg font-bold leading-snug md:text-xl">{item.question}</h3>
                <div
                  className="mx-auto mt-3 mb-4 h-px w-10"
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
          'flex shrink-0 items-end justify-between gap-3 border-t px-5 pb-5 pt-3 text-[9px] leading-snug md:px-7 md:text-[10px]',
          colors.paperBorder,
          colors.muted,
        )}
      >
        <p className="max-w-[42%] text-left">BTM Layout 2nd Stage, Bengaluru, Karnataka 560076</p>
        <p className="font-medium tabular-nums" style={{ color: brandColors.gold }}>
          {pageLabel}
        </p>
        <p className="max-w-[42%] text-right">
          <a href={`tel:${brand.contactPhone}`} className="hover:opacity-80">
            {brand.contactPhone}
          </a>
        </p>
      </footer>
    </div>
  );
}
