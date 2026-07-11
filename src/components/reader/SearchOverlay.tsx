import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PageJumpModalProps {
  open: boolean;
  onClose: () => void;
  currentPage: number;
  totalPages: number;
  onJump: (page: number) => void;
}

export function PageJumpModal({ open, onClose, currentPage, totalPages, onJump }: PageJumpModalProps) {
  const [value, setValue] = useState(String(currentPage + 1));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(value, 10);
    if (!Number.isNaN(page) && page >= 1 && page <= totalPages) {
      onJump(page - 1);
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Go to Page">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="page-input" className="mb-1 block text-sm text-stone-500">
            Page number (1–{totalPages})
          </label>
          <input
            id="page-input"
            type="number"
            min={1}
            max={totalPages}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-stone-900 focus:border-[#C6A43B] focus:outline-none focus:ring-2 focus:ring-[#C6A43B]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        </div>
        <Button type="submit" className="w-full">
          Go to Page
        </Button>
      </form>
    </Modal>
  );
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (pageIndex: number) => void;
}

export function SearchOverlay({ open, onClose, onNavigate }: SearchOverlayProps) {
  const [query, setQuery] = useState('');

  const mockResults = query.length >= 2
    ? [
        { page: 12, snippet: `...${query} appears in Chapter 2...` },
        { page: 45, snippet: `...discussion of ${query} concepts...` },
      ]
    : [];

  return (
    <Modal open={open} onClose={onClose} title="Search in Book" className="max-w-lg">
      <input
        type="search"
        placeholder="Search chapters and content..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-4 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 focus:border-[#C6A43B] focus:outline-none focus:ring-2 focus:ring-[#C6A43B]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        autoFocus
      />

      {query.length < 2 ? (
        <p className="text-sm text-stone-400">Type at least 2 characters to search</p>
      ) : mockResults.length === 0 ? (
        <p className="text-sm text-stone-400">No results found</p>
      ) : (
        <ul className="max-h-60 space-y-2 overflow-y-auto">
          {mockResults.map((result) => (
            <li key={result.page}>
              <button
                type="button"
                onClick={() => {
                  onNavigate(result.page - 1);
                  onClose();
                }}
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                <span className="font-medium text-[#C6A43B]">Page {result.page}</span>
                <p className="text-stone-500">{result.snippet}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-stone-400">
        Full-text search connects to your backend index in production.
      </p>
    </Modal>
  );
}
