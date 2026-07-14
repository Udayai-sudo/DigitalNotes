import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getSessionLabel } from '../services/bookApi';
import { themeConfig } from '../config/theme';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { useTheme } from '../hooks/useTheme';
import type { BookManifest, FlatPage } from '../types/book';
import { FlipBookReader, type FlipBookHandle } from './book/FlipBookReader';
import { PageJumpModal, SearchOverlay } from './reader/SearchOverlay';
import { ReadingToolbar } from './reader/ReadingToolbar';

interface ReadingViewProps {
  manifest: BookManifest;
  pages: FlatPage[];
  initialPageIndex: number;
  onBackToCover: () => void;
}

export function ReadingView({
  manifest,
  pages,
  initialPageIndex,
  onBackToCover,
}: ReadingViewProps) {
  const { theme, cycleTheme } = useTheme();
  const colors = themeConfig[theme];
  const flipRef = useRef<FlipBookHandle>(null);
  const sessionLabel = getSessionLabel(manifest);

  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageJumpOpen, setPageJumpOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { isBookmarked, toggleBookmark } = useBookmarks(manifest.id, pages);
  const { percentComplete } = useReadingProgress({
    bookId: manifest.id,
    bookTitle: manifest.title,
    pages,
    currentPageIndex,
    enabled: true,
  });

  useEffect(() => {
    setCurrentPageIndex(initialPageIndex);
  }, [initialPageIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') flipRef.current?.flipNext();
      if (e.key === 'ArrowLeft') flipRef.current?.flipPrev();
      if (e.key === 'Escape' && isFullscreen) void document.exitFullscreen();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isFullscreen]);

  const [flipResetKey, setFlipResetKey] = useState(0);

  const navigateTo = useCallback((index: number) => {
    const target = Math.max(0, Math.min(pages.length - 1, index));
    setCurrentPageIndex(target);
    flipRef.current?.goToPage(target);
  }, [pages.length]);

  const handleEndSession = useCallback(() => {
    setCurrentPageIndex(0);
    setFlipResetKey((key) => key + 1);
    requestAnimationFrame(() => {
      flipRef.current?.goToPage(0);
    });
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const currentPage = pages[currentPageIndex];
  const statusLabel =
    currentPage?.kind === 'session-start'
      ? sessionLabel
      : currentPage?.kind === 'session-end'
        ? sessionLabel
        : (currentPage?.chapterTitle ?? 'Reading');

  return (
    <div className={clsx('flex h-screen flex-col overflow-hidden', colors.bg, colors.text)}>
      <ReadingToolbar
        theme={theme}
        isFullscreen={isFullscreen}
        isBookmarked={isBookmarked(currentPageIndex)}
        currentPage={currentPageIndex}
        totalPages={pages.length}
        zoom={zoom}
        onPrev={() => flipRef.current?.flipPrev()}
        onNext={() => flipRef.current?.flipNext()}
        onToggleBookmark={() => toggleBookmark(currentPageIndex)}
        onToggleFullscreen={() => void toggleFullscreen()}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenPageJump={() => setPageJumpOpen(true)}
        onZoomIn={() => setZoom((z) => Math.min(1.5, z + 0.1))}
        onZoomOut={() => setZoom((z) => Math.max(0.75, z - 0.1))}
        onCycleTheme={cycleTheme}
        onBackToCover={onBackToCover}
      />

      <main
        className={clsx(
          'relative flex flex-1 flex-col items-center justify-center overflow-auto p-4 md:p-8',
          colors.readerBg,
        )}
      >
        <div className="mb-4 w-full max-w-5xl px-2">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>{statusLabel}</span>
            <span>{percentComplete}% complete</span>
          </div>
        </div>

        <FlipBookReader
          ref={flipRef}
          pages={pages}
          currentIndex={currentPageIndex}
          onPageChange={setCurrentPageIndex}
          zoom={zoom}
          theme={theme}
          bookTitle={manifest.title}
          onEndSession={handleEndSession}
          resetKey={flipResetKey}
        />

        <p className="mt-6 text-center text-xs text-stone-400">
          Use arrow keys or swipe to turn pages · Click corners to flip
        </p>
      </main>

      <PageJumpModal
        open={pageJumpOpen}
        onClose={() => setPageJumpOpen(false)}
        currentPage={currentPageIndex}
        totalPages={pages.length}
        onJump={navigateTo}
      />

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigateTo}
      />
    </div>
  );
}
