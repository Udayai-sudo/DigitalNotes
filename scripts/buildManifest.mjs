import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CHAPTERS_DIR = path.join(ROOT, 'public', 'chapters');
const CONFIG_PATH = path.join(ROOT, 'content', 'book.config.json');
const MANIFEST_PATH = path.join(ROOT, 'public', 'api', 'book-manifest.json');

function humanize(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseChapterFilename(filename) {
  const base = filename.replace(/\.pdf$/i, '');

  const numbered = base.match(/^(\d+)[-_.\s]+(.+)$/i);
  if (numbered) {
    return {
      order: Number.parseInt(numbered[1], 10),
      title: humanize(numbered[2]),
    };
  }

  const chapterPrefix = base.match(/^chapter\s*(\d+)[-_.\s:]*(.*)$/i);
  if (chapterPrefix) {
    const rest = chapterPrefix[2].trim();
    return {
      order: Number.parseInt(chapterPrefix[1], 10),
      title: humanize(rest || `Chapter ${chapterPrefix[1]}`),
    };
  }

  return {
    order: null,
    title: humanize(base),
  };
}

function readBookConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Missing book config at ${CONFIG_PATH}`);
  }

  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function scanChapterPdfs() {
  if (!fs.existsSync(CHAPTERS_DIR)) {
    fs.mkdirSync(CHAPTERS_DIR, { recursive: true });
    return [];
  }

  return fs
    .readdirSync(CHAPTERS_DIR)
    .filter((file) => file.toLowerCase().endsWith('.pdf'))
    .map((filename) => {
      const filePath = path.join(CHAPTERS_DIR, filename);
      const stats = fs.statSync(filePath);
      const parsed = parseChapterFilename(filename);

      return {
        filename,
        filePath,
        uploadedAt: stats.mtime.toISOString(),
        ...parsed,
      };
    })
    .sort((a, b) => {
      if (a.order !== null && b.order !== null) return a.order - b.order;
      if (a.order !== null) return -1;
      if (b.order !== null) return 1;
      return a.filename.localeCompare(b.filename, undefined, { numeric: true });
    });
}

export function buildManifest() {
  const config = readBookConfig();
  const pdfFiles = scanChapterPdfs();

  const chapters = pdfFiles.map((file, index) => {
    const order = file.order ?? index + 1;
    const title = file.title || `Chapter ${order}`;

    return {
      id: slugify(`${order}-${title}`) || `chapter-${order}`,
      title,
      order,
      pdfUrl: `/chapters/${encodeURIComponent(file.filename)}`,
      uploadedAt: file.uploadedAt,
    };
  });

  return {
    ...config,
    version: String(chapters.length),
    updatedAt: new Date().toISOString(),
    chapters,
    totalPages: undefined,
    ...(config.autoTitleFromFirstPdf && chapters.length === 1
      ? { title: chapters[0].title }
      : {}),
  };
}

export function writeManifest() {
  const manifest = buildManifest();
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export const paths = {
  ROOT,
  CHAPTERS_DIR,
  CONFIG_PATH,
  MANIFEST_PATH,
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = writeManifest();
  console.log(`Book manifest updated: ${manifest.chapters.length} chapter(s)`);
  for (const chapter of manifest.chapters) {
    console.log(`  ${chapter.order}. ${chapter.title}`);
  }
}
