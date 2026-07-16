import clsx from 'clsx';
import { motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BOOK_OPEN_DURATION,
  bookEase,
  bookMotionFlags,
  getBookPageSize,
} from '../../config/bookMotion';
import { brandColors, themeConfig } from '../../config/theme';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { useTheme } from '../../hooks/useTheme';
import type { BookManifest, FlatPage } from '../../types/book';
import { CoverFace } from './CoverFace';
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
 * Single 3D book rig: cover leaf and flip pages share one perspective,
 * spine, and motion so opening feels like one physical book.
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

  const showInnerBook = !showCover || isOpening || isClosing;
  const showCoverLeaf = showCover || isOpening;
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
  const spreadW = pageW * 2;
  const isSpread = isOpening || isReading || isClosing;
  const stageWidth = isSpread ? spreadW : pageW;

  const stageBg = showCover || isOpening
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
          animate={{
            opacity: isClosing ? 1 : showCover || isOpening ? 0.85 : 0,
          }}
          transition={{ duration: isOpening ? BOOK_OPEN_DURATION : 0.45 }}
        />
      )}

      {showCover && !isOpening && (
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

      <div className="relative z-10" style={{ perspective: '1800px', perspectiveOrigin: '50% 45%' }}>
        <motion.div
          className="relative"
          style={{
            width: stageWidth,
            height: pageH,
            transformStyle: 'preserve-3d',
          }}
          initial={false}
          animate={{ width: stageWidth }}
          transition={{
            duration: isOpening ? BOOK_OPEN_DURATION : 0.5,
            ease: bookEase,
          }}
        >
          {showInnerBook && (
            <motion.div
              className="absolute top-0 left-0 z-0"
              style={{
                width: spreadW,
                height: pageH,
                transformStyle: 'preserve-3d',
              }}
              initial={false}
              animate={
                closePhase >= 2
                  ? { opacity: 0 }
                  : isOpening
                    ? { opacity: [0, 0.12, 0.5, 0.92, 1] }
                    : { opacity: 1 }
              }
              transition={
                closePhase >= 2
                  ? { duration: 0.55, ease: bookEase }
                  : isOpening
                    ? {
                        duration: BOOK_OPEN_DURATION,
                        times: [0, 0.18, 0.38, 0.68, 1],
                        ease: bookEase,
                      }
                    : { duration: 0.4 }
              }
              onAnimationComplete={() => {
                if (closePhase === 2) onCloseComplete();
              }}
            >
              <div
                className={clsx(
                  'relative h-full w-full',
                  isReading ? 'pointer-events-auto' : 'pointer-events-none',
                )}
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
              </div>
            </motion.div>
          )}

          {showCoverLeaf && (
            <motion.div
              className="absolute top-0 left-0 z-20 box-border"
              style={{
                width: pageW,
                height: pageH,
                transformStyle: 'preserve-3d',
                transformOrigin: 'left center',
              }}
              initial={false}
              animate={
                isOpening
                  ? { rotateY: [0, -20, -85, -150, -178] }
                  : { rotateY: 0 }
              }
              transition={
                isOpening
                  ? {
                      duration: BOOK_OPEN_DURATION,
                      times: [0, 0.15, 0.42, 0.78, 1],
                      ease: bookEase,
                    }
                  : { duration: 0.4 }
              }
              onAnimationComplete={() => {
                if (isOpening) onOpenComplete();
              }}
            >
              {polish && (
                <motion.div
                  className="book-contact-shadow"
                  animate={
                    isOpening
                      ? { opacity: [0.5, 0.7, 0.35, 0.15], scaleX: [1, 1.1, 1.3, 1.45] }
                      : { opacity: 0.55, scaleX: 1 }
                  }
                  transition={{ duration: isOpening ? BOOK_OPEN_DURATION : 0.4 }}
                />
              )}

              <div
                className="pointer-events-none absolute inset-0 box-border rounded-l-md rounded-r-sm"
                style={{
                  transform: 'rotateY(180deg)',
                  backfaceVisibility: 'hidden',
                  background: brandColors.card,
                  boxShadow: 'inset 4px 0 12px rgba(0,0,0,0.35)',
                }}
                aria-hidden
              />

              <div
                className={clsx(
                  'box-border h-full w-full',
                  isOpening ? 'pointer-events-none' : 'pointer-events-auto',
                )}
              >
                <CoverFace
                  manifest={manifest}
                  chapterCount={chapterCount}
                  totalPages={totalPages}
                  hasContent={hasContent}
                  isOpening={isOpening}
                  onStartLearning={hasContent ? beginOpen : undefined}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {isReading && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: bookEase }}
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${theme === 'dark' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)'} 100%)`,
          }}
        />
      )}
    </div>
  );
}
