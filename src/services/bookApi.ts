import type { BookManifest, FlatPage } from '../types/book';

/** Prefix public asset paths with Vite base (e.g. /TextBook/ on GitHub Pages). */
export function withBase(assetPath: string): string {
  if (!assetPath) return assetPath;
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  const base = import.meta.env.BASE_URL || '/';
  return `${base}${assetPath.replace(/^\//, '')}`;
}

export async function fetchBookManifest(): Promise<BookManifest> {
  const response = await fetch(withBase('/api/book-manifest.json'), { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to load book manifest: ${response.statusText}`);
  }

  const data = (await response.json()) as BookManifest;
  return {
    ...data,
    chapters: data.chapters.map((chapter) => ({
      ...chapter,
      pdfUrl: withBase(chapter.pdfUrl),
    })),
  };
}

export function getSessionLabel(manifest: BookManifest): string {
  const slug = manifest.slug ?? '';
  const match = slug.match(/^(\d+)/);
  const day = match ? match[1].padStart(2, '0') : '01';
  return `Day-${day} Session`;
}

export function flattenChaptersToPages(manifest: BookManifest): FlatPage[] {
  const pages: FlatPage[] = [];
  let globalIndex = 0;

  const sortedChapters = [...manifest.chapters].sort((a, b) => a.order - b.order);

  for (const chapter of sortedChapters) {
    const pageCount = chapter.pageCount ?? 1;

    for (let pageInChapter = 1; pageInChapter <= pageCount; pageInChapter += 1) {
      pages.push({
        kind: 'content',
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

export function wrapPagesWithSession(manifest: BookManifest, contentPages: FlatPage[]): FlatPage[] {
  if (contentPages.length === 0) return contentPages;

  const sessionLabel = getSessionLabel(manifest);
  const chapterId = contentPages[0].chapterId;

  const startPage: FlatPage = {
    kind: 'session-start',
    globalIndex: 0,
    sessionLabel,
    chapterId,
    chapterTitle: sessionLabel,
    chapterOrder: 0,
    pageInChapter: 0,
    pdfUrl: '',
  };

  const wrappedContent = contentPages.map((page, index) => ({
    ...page,
    kind: 'content' as const,
    globalIndex: index + 1,
  }));

  const endPage: FlatPage = {
    kind: 'session-end',
    globalIndex: wrappedContent.length + 1,
    sessionLabel,
    chapterId,
    chapterTitle: 'End Session',
    chapterOrder: 0,
    pageInChapter: 0,
    pdfUrl: '',
  };

  return [startPage, ...wrappedContent, endPage];
}

export function getChapterStartPages(pages: FlatPage[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const page of pages) {
    if (page.kind !== 'content') continue;
    if (!map.has(page.chapterId)) {
      map.set(page.chapterId, page.globalIndex);
    }
  }

  return map;
}

export function countContentPages(pages: FlatPage[]): number {
  return pages.filter((page) => page.kind === 'content').length;
}

export function estimateReadingTimeMinutes(totalPages: number, pagesPerMinute = 2): number {
  return Math.max(1, Math.ceil(totalPages / pagesPerMinute));
}
