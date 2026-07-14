import { motion } from 'framer-motion';
import { BookOpen, Clock, Layers, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { brand, brandColors } from '../../config/theme';
import type { BookManifest } from '../../types/book';
import { Button } from '../ui/Button';

interface BookCoverProps {
  manifest: BookManifest;
  chapterCount: number;
  totalPages: number;
  readingTimeMinutes: number;
  savedPageIndex: number;
  onStartReading: (fromSaved?: boolean) => void;
}

function BackCover() {
  return (
    <div
      className="flex h-full flex-col items-center justify-between p-8 md:p-10"
      style={{ background: brandColors.card }}
    >
      <div className="w-full text-center">
        <img
          src={brand.logo}
          alt={brand.name}
          className="mx-auto h-14 w-auto max-w-[220px] object-contain md:h-16"
        />
        <p
          className="mt-4 text-xs font-semibold uppercase tracking-[0.35em]"
          style={{ color: brandColors.gold }}
        >
          Digital Learning
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white">{brand.name}</h2>
        <div className="mx-auto mt-4 h-px w-16" style={{ background: brandColors.gold }} />
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">{brand.tagline}</p>
      </div>

      <p className="text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} StringStack.ai
      </p>
    </div>
  );
}

export function BookCover({
  manifest,
  chapterCount,
  totalPages,
  readingTimeMinutes,
  savedPageIndex,
  onStartReading,
}: BookCoverProps) {
  const [showBack, setShowBack] = useState(false);
  const hasProgress = savedPageIndex > 0;
  const hasContent = chapterCount > 0 && totalPages > 0;

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4 md:p-8"
      style={{
        background: `linear-gradient(135deg, ${brandColors.bgGradientFrom} 0%, ${brandColors.bgGradientTo} 50%, ${brandColors.bg} 100%)`,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative w-full max-w-lg"
      >
        <div
          className="pointer-events-none absolute -inset-8 rounded-[2rem] opacity-30 blur-3xl"
          style={{ background: brandColors.gold }}
        />

        <div className="relative" style={{ perspective: '1200px' }}>
          <motion.div
            className="relative mx-auto"
            animate={{ rotateY: showBack ? 180 : 0 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            style={{ transformStyle: 'preserve-3d', width: 320 }}
          >
            {/* Front cover */}
            <div
              className="relative overflow-hidden rounded-r-md rounded-l-sm border border-zinc-700 shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                borderLeft: `4px solid ${brandColors.gold}`,
                background: `linear-gradient(160deg, ${brandColors.card} 0%, ${brandColors.bgGradientTo} 100%)`,
              }}
            >
              <div className="p-8 md:p-10">
                <p
                  className="text-xs font-semibold uppercase tracking-[0.35em]"
                  style={{ color: brandColors.gold }}
                >
                  {brand.name}
                </p>

                <h1 className="mt-4 font-serif text-4xl font-bold leading-tight text-white">
                  {manifest.title}
                </h1>

                <p className="mt-3 font-serif text-lg italic text-zinc-400">{manifest.subtitle}</p>

                <div className="mt-8 space-y-3 text-sm text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Layers size={16} style={{ color: brandColors.gold }} />
                    <span>{chapterCount} Chapters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} style={{ color: brandColors.gold }} />
                    <span>{totalPages} Pages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} style={{ color: brandColors.gold }} />
                    <span>~{readingTimeMinutes} min read</span>
                  </div>
                </div>

                {!hasContent && (
                  <p className="mt-6 text-sm text-zinc-500">
                    New chapters are added regularly. Check back soon.
                  </p>
                )}

                <div className="mt-10 flex flex-col gap-3">
                  <Button
                    size="lg"
                    className="w-full font-semibold shadow-lg"
                    style={{
                      background: brandColors.gold,
                      color: brandColors.textOnGold,
                    }}
                    onClick={() => onStartReading(false)}
                  >
                    Start Reading
                  </Button>

                  {hasProgress && hasContent && (
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full border-zinc-600 bg-white/10 text-white hover:bg-white/20"
                      onClick={() => onStartReading(true)}
                    >
                      Continue (p. {savedPageIndex + 1})
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Back cover */}
            <div
              className="absolute inset-0 overflow-hidden rounded-l-md rounded-r-sm border border-zinc-700 shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                borderRight: `4px solid ${brandColors.gold}`,
              }}
            >
              <BackCover />
            </div>
          </motion.div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBack((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-[#C6A43B] hover:text-[#C6A43B]"
          >
            <RotateCcw size={15} />
            {showBack ? 'View Front Cover' : 'View Back Cover'}
          </button>
          <p className="text-sm text-zinc-500">{brand.tagline}</p>
        </div>
      </motion.div>
    </div>
  );
}
