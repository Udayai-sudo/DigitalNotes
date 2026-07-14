import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  countContentPages,
  estimateReadingTimeMinutes,
  fetchBookManifest,
  flattenChaptersToPages,
  getChapterStartPages,
  wrapPagesWithSession,
} from '../services/bookApi';
import { getPdfPageCount } from '../services/pdfService';
import type { BookManifest, FlatPage } from '../types/book';

const POLL_INTERVAL_MS = 30_000;

interface UseBookDataResult {
  manifest: BookManifest | null;
  pages: FlatPage[];
  chapterStarts: Map<string, number>;
  totalPages: number;
  contentPageCount: number;
  chapterCount: number;
  readingTimeMinutes: number;
  loading: boolean;
  error: string | null;
  newChaptersAdded: number;
  dismissNewChapters: () => void;
  refetch: () => void;
}

export function useBookData(): UseBookDataResult {
  const [manifest, setManifest] = useState<BookManifest | null>(null);
  const [pages, setPages] = useState<FlatPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newChaptersAdded, setNewChaptersAdded] = useState(0);
  const hasLoaded = useRef(false);
  const previousChapterCount = useRef(0);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(!hasLoaded.current);
    }
    setError(null);

    try {
      const data = await fetchBookManifest();
      const chaptersWithCounts = await Promise.all(
        data.chapters.map(async (chapter) => {
          if (chapter.pageCount && chapter.pageCount > 0) return chapter;
          const count = await getPdfPageCount(chapter.pdfUrl);
          return { ...chapter, pageCount: count };
        }),
      );

      const enriched: BookManifest = {
        ...data,
        chapters: chaptersWithCounts,
        totalPages: chaptersWithCounts.reduce((sum, ch) => sum + (ch.pageCount ?? 0), 0),
      };

      const nextCount = enriched.chapters.length;
      if (hasLoaded.current && nextCount > previousChapterCount.current) {
        setNewChaptersAdded(nextCount - previousChapterCount.current);
      }
      previousChapterCount.current = nextCount;

      setManifest(enriched);
      const contentPages = flattenChaptersToPages(enriched);
      setPages(wrapPagesWithSession(enriched, contentPages));
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book');
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissNewChapters = useCallback(() => {
    setNewChaptersAdded(0);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => void load({ silent: true });
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => void load({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!import.meta.hot) return;

    import.meta.hot.on('chapters-updated', () => {
      void load({ silent: true });
    });
  }, [load]);

  const chapterStarts = useMemo(() => getChapterStartPages(pages), [pages]);
  const totalPages = pages.length;
  const contentPageCount = useMemo(() => countContentPages(pages), [pages]);
  const chapterCount = manifest?.chapters.length ?? 0;
  const readingTimeMinutes = estimateReadingTimeMinutes(contentPageCount);

  return {
    manifest,
    pages,
    chapterStarts,
    totalPages,
    contentPageCount,
    chapterCount,
    readingTimeMinutes,
    loading,
    error,
    newChaptersAdded,
    dismissNewChapters,
    refetch: () => void load(),
  };
}
