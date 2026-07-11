import clsx from 'clsx';
import { Bookmark, Clock, ListTree, StickyNote, X } from 'lucide-react';
import { themeConfig } from '../../config/theme';
import type { Bookmark as BookmarkType, BookManifest, FlatPage, RecentlyReadEntry, ThemeMode } from '../../types/book';
import { ProgressBar } from '../ui/ProgressBar';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  manifest: BookManifest;
  pages: FlatPage[];
  chapterStarts: Map<string, number>;
  currentPageIndex: number;
  bookmarks: BookmarkType[];
  recentlyRead: RecentlyReadEntry[];
  percentComplete: number;
  readingTimeMinutes: number;
  theme: ThemeMode;
  onNavigateChapter: (pageIndex: number) => void;
  onNavigateBookmark: (pageIndex: number) => void;
}

export function Sidebar({
  open,
  onClose,
  manifest,
  pages,
  chapterStarts,
  currentPageIndex,
  bookmarks,
  recentlyRead,
  percentComplete,
  readingTimeMinutes,
  theme,
  onNavigateChapter,
  onNavigateBookmark,
}: SidebarProps) {
  const colors = themeConfig[theme];
  const sortedChapters = [...manifest.chapters].sort((a, b) => a.order - b.order);
  const currentPage = pages[currentPageIndex];

  return (
    <>
      <button
        type="button"
        aria-label="Close sidebar"
        className={clsx(
          'fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0',
          colors.sidebar,
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between border-b border-inherit p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#C6A43B]">StringStack.ai</p>
            <h2 className="font-serif text-lg font-semibold">{manifest.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-black/5 lg:hidden dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <ListTree size={14} />
              Table of Contents
            </h3>
            <ul className="space-y-1">
              {sortedChapters.map((chapter) => {
                const startPage = chapterStarts.get(chapter.id) ?? 0;
                const isActive = currentPage?.chapterId === chapter.id;

                return (
                  <li key={chapter.id}>
                    <button
                      type="button"
                      onClick={() => onNavigateChapter(startPage)}
                      className={clsx(
                        'w-full rounded-lg px-3 py-2 text-left text-sm transition-colors',
                        isActive
                          ? 'bg-[#C6A43B]/10 font-medium text-[#D4AF37]'
                          : 'hover:bg-black/5 dark:hover:bg-white/5',
                      )}
                    >
                      <span className="text-stone-400">{chapter.order}.</span> {chapter.title}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <Bookmark size={14} />
              Bookmarks
            </h3>
            {bookmarks.length === 0 ? (
              <p className="text-sm text-stone-400">No bookmarks yet</p>
            ) : (
              <ul className="space-y-1">
                {bookmarks.map((bookmark) => (
                  <li key={bookmark.id}>
                    <button
                      type="button"
                      onClick={() => onNavigateBookmark(bookmark.globalPageIndex)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      {bookmark.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mb-6">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <StickyNote size={14} />
              Notes
            </h3>
            <p className="text-sm text-stone-400">Select text to add notes (coming soon)</p>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
              <Clock size={14} />
              Recently Read
            </h3>
            {recentlyRead.length === 0 ? (
              <p className="text-sm text-stone-400">No recent activity</p>
            ) : (
              <ul className="space-y-1">
                {recentlyRead.slice(0, 5).map((entry) => (
                  <li key={`${entry.bookId}-${entry.visitedAt}`} className="rounded-lg px-3 py-2 text-sm text-stone-500">
                    Page {entry.globalPageIndex + 1}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="border-t border-inherit p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className={colors.muted}>
              Page {currentPageIndex + 1} of {pages.length}
            </span>
            <span className={colors.muted}>{percentComplete}%</span>
          </div>
          <ProgressBar value={percentComplete} />
          <p className="mt-2 text-xs text-stone-400">~{readingTimeMinutes} min total</p>
        </div>
      </aside>
    </>
  );
}
