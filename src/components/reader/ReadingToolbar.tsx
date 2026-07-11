import clsx from 'clsx';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Menu,
  Minimize,
  Moon,
  Search,
  Sun,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { themeConfig } from '../../config/theme';
import type { ThemeMode } from '../../types/book';
import { Button } from '../ui/Button';

interface ReadingToolbarProps {
  theme: ThemeMode;
  isFullscreen: boolean;
  isBookmarked: boolean;
  currentPage: number;
  totalPages: number;
  zoom: number;
  onToggleSidebar: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleBookmark: () => void;
  onToggleFullscreen: () => void;
  onOpenSearch: () => void;
  onOpenPageJump: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onCycleTheme: () => void;
  onBackToCover: () => void;
}

export function ReadingToolbar({
  theme,
  isFullscreen,
  isBookmarked,
  currentPage,
  totalPages,
  zoom,
  onToggleSidebar,
  onPrev,
  onNext,
  onToggleBookmark,
  onToggleFullscreen,
  onOpenSearch,
  onOpenPageJump,
  onZoomIn,
  onZoomOut,
  onCycleTheme,
  onBackToCover,
}: ReadingToolbarProps) {
  const colors = themeConfig[theme];

  return (
    <header
      className={clsx(
        'flex flex-wrap items-center gap-2 border-b px-3 py-2 backdrop-blur-xl md:px-4',
        colors.toolbar,
      )}
    >
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <Menu size={18} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onBackToCover} className="hidden sm:inline-flex">
          Cover
        </Button>
      </div>

      <div className="mx-auto flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onPrev} disabled={currentPage <= 0} aria-label="Previous page">
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <button
          type="button"
          onClick={onOpenPageJump}
          className="rounded-lg px-3 py-1.5 text-sm font-medium tabular-nums hover:bg-black/5 dark:hover:bg-white/5"
        >
          {currentPage + 1} / {totalPages}
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          disabled={currentPage >= totalPages - 1}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={18} />
        </Button>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onOpenSearch} aria-label="Search">
          <Search size={18} />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleBookmark}
          aria-label="Toggle bookmark"
          className={isBookmarked ? 'text-amber-500' : undefined}
        >
          <Bookmark size={18} fill={isBookmarked ? 'currentColor' : 'none'} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onZoomOut} disabled={zoom <= 0.75} aria-label="Zoom out">
          <ZoomOut size={18} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onZoomIn} disabled={zoom >= 1.5} aria-label="Zoom in">
          <ZoomIn size={18} />
        </Button>
        <Button variant="ghost" size="sm" onClick={onCycleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
        <Button variant="ghost" size="sm" onClick={onToggleFullscreen} aria-label="Toggle fullscreen">
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </Button>
      </div>
    </header>
  );
}
