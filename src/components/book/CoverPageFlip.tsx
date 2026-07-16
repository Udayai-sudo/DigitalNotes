import { forwardRef, useEffect, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { FlipBookRef } from 'react-pageflip';
import type { BookManifest, FlatPage, ThemeMode } from '../../types/book';
import { BookPage } from './BookPage';
import { CoverFace } from './CoverFace';

interface CoverPageFlipProps {
  manifest: BookManifest;
  chapterCount: number;
  totalPages: number;
  firstInnerPage: FlatPage | null;
  pageWidth: number;
  pageHeight: number;
  theme: ThemeMode;
  bookTitle: string;
  onOpenComplete: () => void;
}

const CoverFlipSlot = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
  }
>(function CoverFlipSlot({ children }, ref) {
  return (
    <div ref={ref} className="h-full w-full overflow-hidden" data-density="soft">
      {children}
    </div>
  );
});

/**
 * One-shot cover open using the same HTMLFlipBook soft-flip as inside pages.
 * Reading stays on FlipBookReader — this component unmounts after open.
 */
export function CoverPageFlip({
  manifest,
  chapterCount,
  totalPages,
  firstInnerPage,
  pageWidth,
  pageHeight,
  theme,
  bookTitle,
  onOpenComplete,
}: CoverPageFlipProps) {
  const flipRef = useRef<FlipBookRef>(null);
  const doneRef = useRef(false);
  const hasContent = chapterCount > 0 && totalPages > 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        flipRef.current?.pageFlip()?.flipNext();
      } catch {
        if (!doneRef.current) {
          doneRef.current = true;
          onOpenComplete();
        }
      }
    }, 80);

    const fallback = window.setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onOpenComplete();
      }
    }, 1400);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallback);
    };
  }, [onOpenComplete]);

  const finish = (pageIndex: number) => {
    if (doneRef.current) return;
    if (pageIndex < 1) return;
    doneRef.current = true;
    onOpenComplete();
  };

  return (
    <div className="relative" style={{ width: pageWidth * 2, height: pageHeight }}>
      <HTMLFlipBook
        ref={flipRef}
        width={pageWidth}
        height={pageHeight}
        size="fixed"
        minWidth={pageWidth}
        maxWidth={pageWidth}
        minHeight={pageHeight}
        maxHeight={pageHeight}
        drawShadow
        flippingTime={800}
        usePortrait={false}
        startPage={0}
        autoSize={false}
        maxShadowOpacity={0.5}
        showCover
        mobileScrollSupport
        clickEventForward={false}
        useMouseEvents={false}
        swipeDistance={30}
        showPageCorners={false}
        className="book-flip shadow-2xl"
        onFlip={(e) => finish(e.data)}
      >
        <CoverFlipSlot>
          <CoverFace
            manifest={manifest}
            chapterCount={chapterCount}
            totalPages={totalPages}
            hasContent={hasContent}
            isOpening
          />
        </CoverFlipSlot>

        <CoverFlipSlot>
          <div className="book-page h-full w-full">
            <BookPage
              page={firstInnerPage}
              zoom={1}
              theme={theme}
              isActive
              side="right"
              priority
              bookTitle={bookTitle}
            />
          </div>
        </CoverFlipSlot>

        <CoverFlipSlot>
          <div className="book-page h-full w-full">
            <BookPage
              page={null}
              zoom={1}
              theme={theme}
              isActive={false}
              side="left"
              bookTitle={bookTitle}
            />
          </div>
        </CoverFlipSlot>
      </HTMLFlipBook>
    </div>
  );
}
