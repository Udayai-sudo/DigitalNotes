import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  estimateReadingTimeMinutes,
  fetchBookManifest,
  flattenChaptersToPages,
  getChapterStartPages,
} from '../services/bookApi';
import { getPdfPageCount } from '../services/pdfService';
import type { BookManifest, FlatPage } from '../types/book';

interface UseBookDataResult {
  manifest: BookManifest | null;
  pages: FlatPage[];
  chapterStarts: Map<string, number>;
  totalPages: number;
  chapterCount: number;
  readingTimeMinutes: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBookData(): UseBookDataResult {
  const [manifest, setManifest] = useState<BookManifest | null>(null);
  const [pages, setPages] = useState<FlatPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoaded = useRef(false);

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

      setManifest(enriched);
      setPages(flattenChaptersToPages(enriched));
      hasLoaded.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load book');
    } finally {
      setLoading(false);
    }
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
    if (!import.meta.hot) return;

    import.meta.hot.on('chapters-updated', () => {
      void load({ silent: true });
    });
  }, [load]);

  const chapterStarts = useMemo(() => getChapterStartPages(pages), [pages]);
  const totalPages = pages.length;
  const chapterCount = manifest?.chapters.length ?? 0;
  const readingTimeMinutes = estimateReadingTimeMinutes(totalPages);

  return {
    manifest,
    pages,
    chapterStarts,
    totalPages,
    chapterCount,
    readingTimeMinutes,
    loading,
    error,
    refetch: () => void load(),
  };
}
