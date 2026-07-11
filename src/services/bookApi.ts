import type { BookManifest, FlatPage } from '../types/book';

const MANIFEST_URL = '/api/book-manifest.json';

export async function fetchBookManifest(): Promise<BookManifest> {
  const response = await fetch(MANIFEST_URL, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to load book manifest: ${response.statusText}`);
  }

  return response.json() as Promise<BookManifest>;
}

export function flattenChaptersToPages(manifest: BookManifest): FlatPage[] {
  const pages: FlatPage[] = [];
  let globalIndex = 0;

  const sortedChapters = [...manifest.chapters].sort((a, b) => a.order - b.order);

  for (const chapter of sortedChapters) {
    const pageCount = chapter.pageCount ?? 1;

    for (let pageInChapter = 1; pageInChapter <= pageCount; pageInChapter += 1) {
      pages.push({
        globalIndex,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        chapterOrder: chapter.order,
        pageInChapter,
        pdfUrl: chapter.pdfUrl,
      });
      globalIndex += 1;
    }
  }

  return pages;
}

export function getChapterStartPages(pages: FlatPage[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const page of pages) {
    if (!map.has(page.chapterId)) {
      map.set(page.chapterId, page.globalIndex);
    }
  }

  return map;
}

export function estimateReadingTimeMinutes(totalPages: number, pagesPerMinute = 2): number {
  return Math.max(1, Math.ceil(totalPages / pagesPerMinute));
}
