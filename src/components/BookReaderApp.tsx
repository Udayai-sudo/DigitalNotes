import { useState } from 'react';
import { useBookData } from '../hooks/useBookData';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { BookCover } from './book/BookCover';
import { EmptyBookView } from './EmptyBookView';
import { NewChaptersBanner } from './reader/NewChaptersBanner';
import { ReadingView } from './ReadingView';
import { Button } from './ui/Button';

type AppView = 'cover' | 'reading';

export function BookReaderApp() {
  const {
    manifest,
    pages,
    chapterCount,
    contentPageCount,
    readingTimeMinutes,
    loading,
    error,
    newChaptersAdded,
    dismissNewChapters,
    refetch,
  } = useBookData();

  const [view, setView] = useState<AppView>('cover');
  const [startPageIndex, setStartPageIndex] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const savedProgress = useReadingProgress({
    bookId: manifest?.id ?? '',
    bookTitle: manifest?.title ?? '',
    pages,
    currentPageIndex: startPageIndex,
    enabled: false,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#C6A43B] border-t-transparent" />
          <p className="text-zinc-400">Opening your book...</p>
        </div>
      </div>
    );
  }

  if (error || !manifest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
        <div className="max-w-md text-center">
          <p className="mb-4 text-red-400">{error ?? 'Book not found'}</p>
          <Button onClick={refetch}>Retry</Button>
        </div>
      </div>
    );
  }

  const handleRequestOpen = (fromSaved?: boolean) => {
    const savedPage = savedProgress.getSavedPage();
    setStartPageIndex(fromSaved ? savedPage : 0);
    dismissNewChapters();
    setIsOpening(true);
  };

  const handleOpenComplete = () => {
    setIsOpening(false);
    setView('reading');
  };

  const handleRequestClose = () => {
    setIsClosing(true);
  };

  const handleCloseComplete = () => {
    setIsClosing(false);
    setView('cover');
  };

  return (
    <>
      {view === 'reading' ? (
        pages.length === 0 ? (
          <EmptyBookView onBackToCover={() => setView('cover')} />
        ) : (
          <ReadingView
            manifest={manifest}
            pages={pages}
            initialPageIndex={startPageIndex}
            isClosing={isClosing}
            onRequestClose={handleRequestClose}
            onCloseComplete={handleCloseComplete}
          />
        )
      ) : (
        <BookCover
          manifest={manifest}
          chapterCount={chapterCount}
          totalPages={contentPageCount}
          readingTimeMinutes={readingTimeMinutes}
          savedPageIndex={savedProgress.getSavedPage()}
          isOpening={isOpening}
          onRequestOpen={handleRequestOpen}
          onOpenComplete={handleOpenComplete}
        />
      )}

      <NewChaptersBanner count={newChaptersAdded} onDismiss={dismissNewChapters} />
    </>
  );
}
