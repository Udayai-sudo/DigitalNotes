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
import { themeConfig } from '../../config/theme';
import { BookPage, preloadNearbyPages } from './BookPage';

export interface FlipBookHandle {
  flipNext: () => void;
  flipPrev: () => void;
  goToPage: (index: number) => void;
}

interface FlipBookReaderProps {
  pages: FlatPage[];
  currentIndex: number;
  onPageChange: (index: number) => void;
  zoom: number;
  theme: ThemeMode;
}

interface FlipPageSlotProps {
  page: FlatPage | null;
  zoom: number;
  theme: ThemeMode;
  isActive: boolean;
  slotIndex: number;
}

const FlipPageSlot = forwardRef<HTMLDivElement, FlipPageSlotProps>(function FlipPageSlot(
  { page, zoom, theme, isActive, slotIndex },
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
      />
    </div>
  );
});

export const FlipBookReader = forwardRef<FlipBookHandle, FlipBookReaderProps>(
  function FlipBookReader({ pages, currentIndex, onPageChange, zoom, theme }, ref) {
    const flipRef = useRef<FlipBookRef>(null);
    const isMobile = useIsMobile();
    const colors = themeConfig[theme];
    const totalPages = pages.length;
    const { windowStart, windowEnd } = useVirtualWindow(currentIndex, totalPages);

    const [dimensions, setDimensions] = useState({ width: 400, height: 560 });

    useEffect(() => {
      const update = () => {
        const maxWidth = Math.min(window.innerWidth - (isMobile ? 32 : 320), 520);
        const width = Math.max(280, maxWidth);
        const height = Math.round(width * 1.35);
        setDimensions({ width, height });
      };

      update();
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }, [isMobile]);

    useEffect(() => {
      preloadNearbyPages(pages, currentIndex, zoom);
    }, [currentIndex, pages, zoom]);

    const windowPages = useMemo(() => {
      const slots: (FlatPage | null)[] = [];

      for (let i = windowStart; i < windowEnd; i += 1) {
        slots.push(pages[i] ?? null);
      }

      while (slots.length < VIRTUAL_WINDOW_SIZE) {
        slots.push(null);
      }

      return slots.slice(0, VIRTUAL_WINDOW_SIZE);
    }, [pages, windowEnd, windowStart]);

    const localIndex = currentIndex - windowStart;

    const flipNext = useCallback(() => {
      if (currentIndex >= totalPages - 1) return;

      const api = flipRef.current?.pageFlip();
      if (api) {
        const local = api.getCurrentPageIndex();
        if (local < windowPages.length - 1) {
          api.flipNext();
          return;
        }
      }

      onPageChange(Math.min(totalPages - 1, currentIndex + 1));
    }, [currentIndex, onPageChange, totalPages, windowPages.length]);

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

    useImperativeHandle(ref, () => ({ flipNext, flipPrev, goToPage }), [flipNext, flipPrev, goToPage]);

    const handleFlip = useCallback(
      (e: { data: number }) => {
        const newLocal = e.data;
        const globalIndex = windowStart + newLocal;
        if (globalIndex !== currentIndex && globalIndex < totalPages) {
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
          />
        </div>
      );
    }

    return (
      <div className="relative mx-auto" style={{ perspective: '2000px' }}>
        <div className="absolute -inset-6 rounded-3xl bg-black/10 blur-2xl dark:bg-black/40" />

        <HTMLFlipBook
          ref={flipRef}
          key={`${windowStart}-${zoom}`}
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={280}
          maxWidth={520}
          minHeight={380}
          maxHeight={720}
          drawShadow
          flippingTime={800}
          usePortrait={false}
          startPage={localIndex}
          autoSize={false}
          maxShadowOpacity={0.5}
          showCover={false}
          mobileScrollSupport
          clickEventForward={false}
          useMouseEvents
          swipeDistance={30}
          showPageCorners
          className={clsx('book-flip shadow-2xl', colors.shadow)}
          onFlip={handleFlip}
        >
          {windowPages.map((page, index) => (
            <FlipPageSlot
              key={`${windowStart + index}-${page?.globalIndex ?? 'blank'}`}
              page={page}
              zoom={zoom}
              theme={theme}
              isActive={Math.abs(currentIndex - (windowStart + index)) <= 1}
              slotIndex={windowStart + index}
            />
          ))}
        </HTMLFlipBook>
      </div>
    );
  },
);
