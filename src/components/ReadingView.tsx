import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { themeConfig } from '../config/theme';
import { useBookmarks } from '../hooks/useBookmarks';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { useTheme } from '../hooks/useTheme';
import { loadRecentlyRead } from '../services/progressStorage';
import type { BookManifest, FlatPage } from '../types/book';
import { FlipBookReader, type FlipBookHandle } from './book/FlipBookReader';
import { PageJumpModal, SearchOverlay } from './reader/SearchOverlay';
import { ReadingToolbar } from './reader/ReadingToolbar';
import { Sidebar } from './sidebar/Sidebar';

interface ReadingViewProps {
  manifest: BookManifest;
  pages: FlatPage[];
  chapterStarts: Map<string, number>;
  chapterCount: number;
  readingTimeMinutes: number;
  initialPageIndex: number;
  onBackToCover: () => void;
}

export function ReadingView({
  manifest,
  pages,
  chapterStarts,
  readingTimeMinutes,
  initialPageIndex,
  onBackToCover,
}: ReadingViewProps) {
  const { theme, cycleTheme } = useTheme();
  const colors = themeConfig[theme];
  const flipRef = useRef<FlipBookHandle>(null);

  const [currentPageIndex, setCurrentPageIndex] = useState(initialPageIndex);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageJumpOpen, setPageJumpOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { bookmarks, isBookmarked, toggleBookmark } = useBookmarks(manifest.id, pages);
  const { percentComplete } = useReadingProgress({
    bookId: manifest.id,
    bookTitle: manifest.title,
    pages,
    currentPageIndex,
    enabled: true,
  });

  const recentlyRead = loadRecentlyRead();

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

  const navigateTo = useCallback((index: number) => {
    setCurrentPageIndex(index);
    flipRef.current?.goToPage(index);
    setSidebarOpen(false);
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

  return (
    <div className={clsx('flex h-screen flex-col overflow-hidden', colors.bg, colors.text)}>
      <ReadingToolbar
        theme={theme}
        isFullscreen={isFullscreen}
        isBookmarked={isBookmarked(currentPageIndex)}
        currentPage={currentPageIndex}
        totalPages={pages.length}
        zoom={zoom}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
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

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          manifest={manifest}
          pages={pages}
          chapterStarts={chapterStarts}
          currentPageIndex={currentPageIndex}
          bookmarks={bookmarks}
          recentlyRead={recentlyRead}
          percentComplete={percentComplete}
          readingTimeMinutes={readingTimeMinutes}
          theme={theme}
          onNavigateChapter={navigateTo}
          onNavigateBookmark={navigateTo}
        />

        <main
          className={clsx(
            'relative flex flex-1 flex-col items-center justify-center overflow-auto p-4 md:p-8',
            colors.readerBg,
          )}
        >
          <div className="mb-4 w-full max-w-5xl px-2">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span>
                {pages[currentPageIndex]?.chapterTitle ?? 'Reading'}
              </span>
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
          />

          <p className="mt-6 text-center text-xs text-stone-400">
            Use arrow keys or swipe to turn pages · Click corners to flip
          </p>
        </main>
      </div>

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
