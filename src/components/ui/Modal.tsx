import clsx from 'clsx';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900',
          className,
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900 dark:text-zinc-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
