import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { bookEase, bookMotionFlags, getBookPageSize } from '../../config/bookMotion';
import { brandColors, themeConfig } from '../../config/theme';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { useTheme } from '../../hooks/useTheme';
import type { BookManifest, FlatPage } from '../../types/book';
import { CoverFace } from './CoverFace';
import { CoverPageFlip } from './CoverPageFlip';
import { FlipBookReader, type FlipBookHandle } from './FlipBookReader';

interface BookOpenStageProps {
  manifest: BookManifest;
  pages: FlatPage[];
  chapterCount: number;
  totalPages: number;
  initialPageIndex: number;
  showCover: boolean;
  isOpening: boolean;
  isClosing: boolean;
  onRequestOpen: (fromSaved?: boolean) => void;
  onOpenComplete: () => void;
  onRequestClose: () => void;
  onCloseComplete: () => void;
}

/**
 * Closed cover = CoverFace.
 * Cover open ONLY = HTMLFlipBook soft-flip (CoverPageFlip) — same engine as inside pages.
 * Inside reading = original FlipBookReader (unchanged from the "Nice" build).
 */
export function BookOpenStage({
  manifest,
  pages,
  chapterCount,
  totalPages,
  initialPageIndex,
  showCover,
  isOpening,
  isClosing,
  onRequestOpen,
  onOpenComplete,
  onRequestClose,
  onCloseComplete,
}: BookOpenStageProps) {
  const { theme } = useTheme();
  const colors = themeConfig[theme];
  const flipRef = useRef<FlipBookHandle>(null);
  const prefersReducedMotion = useReducedMotion();
  const polish = bookMotionFlags.USE_MOTION_POLISH;
  const hasContent = chapterCount > 0 && totalPages > 0;

  const [pageSize, setPageSize] = useState(() => getBookPageSize());
  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [closePhase, setClosePhase] = useState(0);

  const showClosedCover = showCover && !isOpening;
  const showCoverFlip = isOpening;
  const showInnerBook = (!showCover && !isOpening) || isClosing;
  const isReading = !showCover && !isOpening && !isClosing;

  useReadingProgress({
    bookId: manifest.id,
    bookTitle: manifest.title,
    pages,
    currentPageIndex,
    enabled: isReading,
  });

  useEffect(() => {
    setCurrentPageIndex(initialPageIndex);
  }, [initialPageIndex]);

  useEffect(() => {
    const syncSize = () => {
      const next = getBookPageSize();
      setPageSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    };
    syncSize();
    window.addEventListener('resize', syncSize);
    return () => window.removeEventListener('resize', syncSize);
  }, []);

  useEffect(() => {
    if (!isClosing) {
      setClosePhase(0);
      return;
    }
    if (closePhase !== 0) return;

    if (prefersReducedMotion) {
      onCloseComplete();
      return;
    }

    setClosePhase(1);
    flipRef.current?.flipToStartRapid(() => {
      setClosePhase(2);
    });
  }, [isClosing, closePhase, prefersReducedMotion, onCloseComplete]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isReading || isClosing) return;
      if (e.key === 'ArrowRight') flipRef.current?.flipNext();
      if (e.key === 'ArrowLeft') flipRef.current?.flipPrev();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isReading, isClosing]);

  const handleEndSession = useCallback(() => {
    if (isClosing) return;
    if (prefersReducedMotion) {
      onRequestClose();
      onCloseComplete();
      return;
    }
    onRequestClose();
  }, [isClosing, onCloseComplete, onRequestClose, prefersReducedMotion]);

  const beginOpen = useCallback(() => {
    if (isOpening) return;
    if (prefersReducedMotion) {
      onRequestOpen(false);
      onOpenComplete();
      return;
    }
    onRequestOpen(false);
  }, [isOpening, onOpenComplete, onRequestOpen, prefersReducedMotion]);

  const pageW = pageSize.width;
  const pageH = pageSize.height;
  const stageWidth = showClosedCover ? pageW : pageW * 2;

  const stageBg =
    showClosedCover || showCoverFlip
      ? `linear-gradient(135deg, ${brandColors.bgGradientFrom} 0%, ${brandColors.bgGradientTo} 50%, ${brandColors.bg} 100%)`
      : undefined;

  return (
    <div
      className={clsx(
        'relative flex h-screen w-screen items-center justify-center overflow-hidden p-4 md:p-8',
        !stageBg && colors.bg,
        !stageBg && colors.text,
        !stageBg && colors.readerBg,
      )}
      style={stageBg ? { background: stageBg } : undefined}
    >
      {polish && (
        <motion.div
          className="book-stage-vignette"
          initial={false}
          animate={{ opacity: isClosing || showClosedCover || showCoverFlip ? 0.85 : 0 }}
          transition={{ duration: 0.45 }}
        />
      )}

      {showClosedCover && (
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[2rem] opacity-30 blur-3xl"
          style={{
            width: pageW + 64,
            height: pageH + 64,
            background: brandColors.gold,
          }}
          aria-hidden
        />
      )}

      <motion.div
        className="relative z-10"
        style={{ height: pageH }}
        initial={false}
        animate={{ width: stageWidth }}
        transition={{ duration: showCoverFlip ? 0.8 : 0.4, ease: bookEase }}
      >
        {showClosedCover && (
          <div className="relative" style={{ width: pageW, height: pageH }}>
            {polish && <div className="book-contact-shadow" />}
            <CoverFace
              manifest={manifest}
              chapterCount={chapterCount}
              totalPages={totalPages}
              hasContent={hasContent}
              onStartLearning={hasContent ? beginOpen : undefined}
            />
          </div>
        )}

        {showCoverFlip && (
          <CoverPageFlip
            manifest={manifest}
            chapterCount={chapterCount}
            totalPages={totalPages}
            firstInnerPage={pages[0] ?? null}
            pageWidth={pageW}
            pageHeight={pageH}
            theme={theme}
            bookTitle={manifest.title}
            onOpenComplete={onOpenComplete}
          />
        )}

        {showInnerBook && (
          <motion.div
            className="relative h-full w-full"
            style={{ width: pageW * 2, height: pageH }}
            initial={false}
            animate={{ opacity: closePhase >= 2 ? 0 : 1 }}
            transition={{ duration: 0.45, ease: bookEase }}
            onAnimationComplete={() => {
              if (closePhase === 2) onCloseComplete();
            }}
          >
            <FlipBookReader
              ref={flipRef}
              pages={pages}
              currentIndex={currentPageIndex}
              onPageChange={setCurrentPageIndex}
              zoom={1}
              theme={theme}
              bookTitle={manifest.title}
              onEndSession={handleEndSession}
              embedded
              pageSize={pageSize}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
