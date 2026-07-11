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
        <p
          className="text-xs font-semibold uppercase tracking-[0.35em]"
          style={{ color: brandColors.gold }}
        >
          Digital Learning
        </p>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
          {brand.name}
        </h2>
        <div className="mx-auto mt-4 h-px w-16" style={{ background: brandColors.gold }} />
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">{brand.tagline}</p>
        <p className="mt-2 text-xs uppercase tracking-widest text-zinc-500">{brand.subtitle}</p>
      </div>

      <div className="w-full space-y-3 text-center">
        <div
          className="mx-auto flex h-14 w-full max-w-[180px] items-end justify-center gap-[3px] px-4"
          aria-hidden
        >
          {Array.from({ length: 32 }).map((_, i) => (
            <div
              key={i}
              className="w-[2px] rounded-sm"
              style={{
                height: `${12 + (i % 5) * 6}px`,
                background: i % 3 === 0 ? brandColors.gold : '#555',
              }}
            />
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">stringstack.ai</p>
      </div>

      <p className="text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} StringStack.ai · All rights reserved
      </p>
    </div>
  );
}

function FrontCover({
  manifest,
  chapterCount,
  totalPages,
  readingTimeMinutes,
  savedPageIndex,
  hasChapters,
  hasProgress,
  onStartReading,
}: {
  manifest: BookManifest;
  chapterCount: number;
  totalPages: number;
  readingTimeMinutes: number;
  savedPageIndex: number;
  hasChapters: boolean;
  hasProgress: boolean;
  onStartReading: (fromSaved?: boolean) => void;
}) {
  return (
    <div
      className="flex h-full flex-col justify-between p-8 md:p-10"
      style={{
        background: `linear-gradient(160deg, ${brandColors.card} 0%, ${brandColors.bgGradientTo} 100%)`,
      }}
    >
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-[0.35em]"
          style={{ color: brandColors.gold }}
        >
          Study Material
        </p>

        <h1 className="mt-4 font-serif text-3xl font-bold leading-tight text-white md:text-4xl">
          {manifest.title}
        </h1>

        <p className="mt-2 text-sm text-zinc-400">{manifest.subtitle}</p>

        <div className="mt-8 space-y-2.5 text-sm text-zinc-300">
          <div className="flex items-center gap-2">
            <Layers size={15} style={{ color: brandColors.gold }} />
            <span>{chapterCount} Chapters</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={15} style={{ color: brandColors.gold }} />
            <span>{totalPages} Pages</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={15} style={{ color: brandColors.gold }} />
            <span>~{readingTimeMinutes} min read</span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full font-semibold shadow-lg"
            style={{
              background: brandColors.gold,
              color: brandColors.textOnGold,
            }}
            onClick={() => onStartReading(false)}
            disabled={!hasChapters}
          >
            Start Reading
          </Button>
          {hasProgress && hasChapters && (
            <Button
              size="lg"
              variant="secondary"
              className="w-full border-zinc-600 bg-transparent text-zinc-300 hover:bg-zinc-800"
              onClick={() => onStartReading(true)}
            >
              Continue (p. {savedPageIndex + 1})
            </Button>
          )}
        </div>

        {!hasChapters && (
          <p className="mt-4 rounded-xl border border-zinc-700 bg-black/30 px-4 py-3 text-sm text-zinc-400">
            Add your PDF to{' '}
            <code className="rounded bg-zinc-800 px-1 text-zinc-300">public/chapters/</code>
          </p>
        )}
      </div>
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
  const hasChapters = chapterCount > 0;

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
        className="relative w-full max-w-4xl"
      >
        <div
          className="pointer-events-none absolute -inset-8 rounded-[2rem] opacity-30 blur-3xl"
          style={{ background: brandColors.gold }}
        />

        <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:items-stretch lg:justify-center">
          {/* 3D Book */}
          <div className="relative" style={{ perspective: '1200px' }}>
            <motion.div
              className="relative flex"
              animate={{ rotateY: showBack ? 180 : 0 }}
              transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div
                className="relative h-[480px] w-[300px] overflow-hidden rounded-r-md rounded-l-sm border border-zinc-700 shadow-2xl md:h-[520px] md:w-[320px]"
                style={{
                  backfaceVisibility: 'hidden',
                  borderLeft: `4px solid ${brandColors.gold}`,
                }}
              >
                <FrontCover
                  manifest={manifest}
                  chapterCount={chapterCount}
                  totalPages={totalPages}
                  readingTimeMinutes={readingTimeMinutes}
                  savedPageIndex={savedPageIndex}
                  hasChapters={hasChapters}
                  hasProgress={hasProgress}
                  onStartReading={onStartReading}
                />
              </div>

              {/* Back */}
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

              {/* Spine */}
              <div
                className="absolute -left-3 top-2 bottom-2 w-3 rounded-l-sm"
                style={{
                  background: `linear-gradient(90deg, ${brandColors.goldMuted}, ${brandColors.gold})`,
                  transform: 'rotateY(-90deg) translateX(-1px)',
                  transformOrigin: 'right center',
                }}
              />
            </motion.div>
          </div>

          {/* Side info panel — matches login card style */}
          <div
            className="w-full max-w-xs rounded-2xl border p-6 lg:max-w-[260px]"
            style={{
              background: brandColors.card,
              borderColor: brandColors.cardBorder,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-[0.3em]"
              style={{ color: brandColors.gold }}
            >
              Welcome
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">Your Digital Book</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Content is loaded directly from your uploaded PDF files.
            </p>

            <button
              type="button"
              onClick={() => setShowBack((v) => !v)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-600 px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:border-[#C6A43B] hover:text-[#C6A43B]"
            >
              <RotateCcw size={15} />
              {showBack ? 'View Front Cover' : 'View Back Cover'}
            </button>

            <p className="mt-6 text-center text-xs text-zinc-600">{brand.tagline}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
