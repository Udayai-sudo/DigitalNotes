import clsx from 'clsx';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { FlipBookRef } from 'react-pageflip';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useVirtualWindow, VIRTUAL_WINDOW_SIZE } from '../../hooks/useVirtualPages';
import type { FlatPage, ThemeMode } from '../../types/book';
import { getBookPageSize } from '../../config/bookMotion';
import { themeConfig } from '../../config/theme';
import { BookPage, preloadNearbyPages } from './BookPage';

export interface FlipBookHandle {
  flipNext: () => void;
  flipPrev: () => void;
  goToPage: (index: number) => void;
  /** Flip back to page 0 quickly, then call onComplete. */
  flipToStartRapid: (onComplete: () => void) => void;
}

interface FlipBookReaderProps {
  pages: FlatPage[];
  currentIndex: number;
  onPageChange: (index: number) => void;
  zoom: number;
  theme: ThemeMode;
  bookTitle?: string;
  onEndSession?: () => void;
  resetKey?: number;
  /** Skip outer perspective when nested inside BookOpenStage. */
  embedded?: boolean;
  /** Force exact page size (must match closed cover). */
  pageSize?: { width: number; height: number };
}

interface FlipPageSlotProps {
  page: FlatPage | null;
  zoom: number;
  theme: ThemeMode;
  isActive: boolean;
  slotIndex: number;
  bookTitle?: string;
  onEndSession?: () => void;
}

const FlipPageSlot = forwardRef<HTMLDivElement, FlipPageSlotProps>(function FlipPageSlot(
  { page, zoom, theme, isActive, slotIndex, bookTitle, onEndSession },
  ref,
) {
  const colors = themeConfig[theme];
  const side = slotIndex % 2 === 0 ? 'left' : 'right';

  return (
    <div
      ref={ref}
      className={clsx('book-page h-full w-full overflow-hidden', colors.paper, colors.shadow)}
      data-density="soft"
    >
      <BookPage
        page={page}
        zoom={zoom}
        theme={theme}
        isActive={isActive}
        side={side}
        priority={isActive}
        bookTitle={bookTitle}
        onEndSession={onEndSession}
      />
    </div>
  );
});

export const FlipBookReader = forwardRef<FlipBookHandle, FlipBookReaderProps>(
  function FlipBookReader(
    {
      pages,
      currentIndex,
      onPageChange,
      zoom,
      theme,
      bookTitle,
      onEndSession,
      resetKey = 0,
      embedded = false,
      pageSize: pageSizeProp,
    },
    ref,
  ) {
    const flipRef = useRef<FlipBookRef>(null);
    const indexRef = useRef(currentIndex);
    const rewindTimerRef = useRef<number | null>(null);
    const isMobile = useIsMobile();
    const colors = themeConfig[theme];
    const totalPages = pages.length;
    const virtual = useVirtualWindow(currentIndex, totalPages);

    const [dimensions, setDimensions] = useState(() => pageSizeProp ?? getBookPageSize());
    /** Pins page window at 0 and speeds flips for End Session rewind. */
    const [rewinding, setRewinding] = useState(false);

    indexRef.current = currentIndex;

    const windowStart = rewinding ? 0 : virtual.windowStart;
    const windowEnd = rewinding
      ? Math.min(totalPages, Math.max(currentIndex + 2, VIRTUAL_WINDOW_SIZE))
      : virtual.windowEnd;

    useEffect(() => {
      if (pageSizeProp) {
        setDimensions(pageSizeProp);
        return;
      }

      const update = () => {
        const next = getBookPageSize();
        setDimensions((prev) =>
          prev.width === next.width && prev.height === next.height ? prev : next,
        );
      };

      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }, [isMobile, pageSizeProp]);

    useEffect(() => {
      preloadNearbyPages(pages, currentIndex, zoom);
    }, [currentIndex, pages, zoom]);

    const windowPages = useMemo(() => {
      const slots: (FlatPage | null)[] = [];

      for (let i = windowStart; i < windowEnd; i += 1) {
        slots.push(pages[i] ?? null);
      }

      return slots;
    }, [pages, windowEnd, windowStart]);

    const localIndex = Math.max(0, Math.min(windowPages.length - 1, currentIndex - windowStart));

    const flipNext = useCallback(() => {
      if (currentIndex >= totalPages - 1) return;

      const api = flipRef.current?.pageFlip();
      if (api) {
        const local = api.getCurrentPageIndex();
        const nextLocal = currentIndex + 1 - windowStart;
        if (local < nextLocal && nextLocal < windowPages.length) {
          api.flipNext();
          return;
        }
      }

      onPageChange(Math.min(totalPages - 1, currentIndex + 1));
    }, [currentIndex, onPageChange, totalPages, windowPages.length, windowStart]);

    const flipPrev = useCallback(() => {
      if (currentIndex <= 0) return;

      const api = flipRef.current?.pageFlip();
      if (api) {
        const local = api.getCurrentPageIndex();
        if (local > 0) {
          api.flipPrev();
          return;
        }
      }

      onPageChange(Math.max(0, currentIndex - 1));
    }, [currentIndex, onPageChange]);

    const goToPage = useCallback(
      (index: number) => {
        onPageChange(Math.max(0, Math.min(totalPages - 1, index)));
      },
      [onPageChange, totalPages],
    );

    const clearRewindTimer = useCallback(() => {
      if (rewindTimerRef.current != null) {
        window.clearTimeout(rewindTimerRef.current);
        rewindTimerRef.current = null;
      }
    }, []);

    const finishRewind = useCallback(
      (onComplete: () => void) => {
        clearRewindTimer();
        if (indexRef.current > 0) onPageChange(0);
        setRewinding(false);
        rewindTimerRef.current = window.setTimeout(() => {
          rewindTimerRef.current = null;
          onComplete();
        }, 200);
      },
      [clearRewindTimer, onPageChange],
    );

    const flipToStartRapid = useCallback(
      (onComplete: () => void) => {
        clearRewindTimer();

        if (indexRef.current <= 0) {
          onComplete();
          return;
        }

        if (isMobile) {
          onPageChange(0);
          rewindTimerRef.current = window.setTimeout(() => {
            rewindTimerRef.current = null;
            onComplete();
          }, 160);
          return;
        }

        setRewinding(true);

        if (indexRef.current > 8) {
          onPageChange(6);
        }

        const deadline = Date.now() + 4000;

        const step = () => {
          if (indexRef.current <= 0 || Date.now() > deadline) {
            finishRewind(onComplete);
            return;
          }

          const api = flipRef.current?.pageFlip();
          if (api && api.getCurrentPageIndex() > 0) {
            api.flipPrev();
          } else {
            onPageChange(Math.max(0, indexRef.current - 1));
          }

          rewindTimerRef.current = window.setTimeout(step, 200);
        };

        rewindTimerRef.current = window.setTimeout(step, 160);
      },
      [clearRewindTimer, finishRewind, isMobile, onPageChange],
    );

    useEffect(() => () => clearRewindTimer(), [clearRewindTimer]);

    useEffect(() => {
      const api = flipRef.current?.pageFlip();
      if (!api || api.getPageCount() === 0) return;

      const targetLocal = currentIndex - windowStart;
      if (api.getCurrentPageIndex() !== targetLocal) {
        api.turnToPage(targetLocal);
      }
    }, [currentIndex, windowStart]);

    useImperativeHandle(
      ref,
      () => ({ flipNext, flipPrev, goToPage, flipToStartRapid }),
      [flipNext, flipPrev, goToPage, flipToStartRapid],
    );

    const handleFlip = useCallback(
      (e: { data: number }) => {
        const newLocal = e.data;
        const globalIndex = Math.max(0, Math.min(totalPages - 1, windowStart + newLocal));
        if (globalIndex !== currentIndex) {
          onPageChange(globalIndex);
        }
      },
      [currentIndex, onPageChange, totalPages, windowStart],
    );

    if (totalPages === 0) {
      return (
        <div className="flex h-96 items-center justify-center text-stone-500">
          No pages available
        </div>
      );
    }

    if (isMobile) {
      const page = pages[currentIndex];
      return (
        <div
          className={clsx(
            'mx-auto overflow-hidden rounded-lg',
            colors.shadow,
            colors.paperBorder,
            'border',
          )}
          style={{ width: dimensions.width, height: dimensions.height }}
        >
          <BookPage
            page={page ?? null}
            zoom={zoom}
            theme={theme}
            isActive
            side="right"
            priority
            bookTitle={bookTitle}
            onEndSession={onEndSession}
          />
        </div>
      );
    }

    return (
      <div
        className={clsx('relative', !embedded && 'mx-auto')}
        style={
          embedded
            ? { width: dimensions.width * 2, height: dimensions.height }
            : { perspective: '2000px' }
        }
      >
        {!embedded && (
          <div className="absolute -inset-6 rounded-3xl bg-black/10 blur-2xl dark:bg-black/40" />
        )}

        <HTMLFlipBook
          ref={flipRef}
          key={rewinding ? `rewind-${zoom}-${resetKey}` : `${windowStart}-${zoom}-${resetKey}`}
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={dimensions.width}
          maxWidth={dimensions.width}
          minHeight={dimensions.height}
          maxHeight={dimensions.height}
          drawShadow
          flippingTime={rewinding ? 170 : 800}
          usePortrait={false}
          startPage={localIndex}
          autoSize={false}
          maxShadowOpacity={0.5}
          showCover={false}
          mobileScrollSupport
          clickEventForward={false}
          useMouseEvents={!rewinding}
          swipeDistance={30}
          showPageCorners={!rewinding}
          className={clsx('book-flip shadow-2xl', colors.shadow)}
          onFlip={handleFlip}
        >
          {windowPages.map((page, index) => (
            <FlipPageSlot
              key={`${windowStart + index}-${page?.globalIndex ?? 'blank'}-${page?.kind ?? 'blank'}`}
              page={page}
              zoom={zoom}
              theme={theme}
              isActive={Math.abs(currentIndex - (windowStart + index)) <= 1}
              slotIndex={windowStart + index}
              bookTitle={bookTitle}
              onEndSession={onEndSession}
            />
          ))}
        </HTMLFlipBook>
      </div>
    );
  },
);
