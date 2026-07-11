import { useCallback, useEffect, useState } from 'react';
import { loadBookmarks, saveBookmarks } from '../services/progressStorage';
import type { Bookmark, FlatPage } from '../types/book';

export function useBookmarks(bookId: string, pages: FlatPage[]) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks(loadBookmarks(bookId));
  }, [bookId]);

  const persist = useCallback(
    (next: Bookmark[]) => {
      setBookmarks(next);
      saveBookmarks(bookId, next);
    },
    [bookId],
  );

  const isBookmarked = useCallback(
    (pageIndex: number) => bookmarks.some((b) => b.globalPageIndex === pageIndex),
    [bookmarks],
  );

  const toggleBookmark = useCallback(
    (pageIndex: number) => {
      const page = pages[pageIndex];
      if (!page) return;

      if (isBookmarked(pageIndex)) {
        persist(bookmarks.filter((b) => b.globalPageIndex !== pageIndex));
        return;
      }

      const bookmark: Bookmark = {
        id: crypto.randomUUID(),
        bookId,
        globalPageIndex: pageIndex,
        chapterTitle: page.chapterTitle,
        label: `${page.chapterTitle} — Page ${page.pageInChapter}`,
        createdAt: new Date().toISOString(),
      };

      persist([bookmark, ...bookmarks]);
    },
    [bookId, bookmarks, isBookmarked, pages, persist],
  );

  const removeBookmark = useCallback(
    (id: string) => {
      persist(bookmarks.filter((b) => b.id !== id));
    },
    [bookmarks, persist],
  );

  return { bookmarks, isBookmarked, toggleBookmark, removeBookmark };
}
