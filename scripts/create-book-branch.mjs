import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paths, writeManifest } from './buildManifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_PATH = path.join(ROOT, 'books', 'registry.json');

function run(command) {
  execSync(command, { cwd: ROOT, stdio: 'inherit' });
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--slug') args.slug = argv[++i];
    else if (token === '--title') args.title = argv[++i];
    else if (token === '--pdf') args.pdf = argv[++i];
    else if (token === '--docx') args.docx = argv[++i];
    else if (token === '--push') args.push = true;
    else if (token === '--no-commit') args.noCommit = true;
  }
  return args;
}

function readRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    return { books: [] };
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
}

function writeRegistry(registry) {
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
}

function clearChapterSources() {
  for (const file of fs.readdirSync(paths.CHAPTERS_DIR)) {
    const lower = file.toLowerCase();
    if (lower.endsWith('.pdf') || lower.endsWith('.docx') || lower.endsWith('.content.json')) {
      fs.unlinkSync(path.join(paths.CHAPTERS_DIR, file));
    }
  }
}

function resolveSourcePath(sourceArg, extension) {
  const withExt = sourceArg.toLowerCase().endsWith(extension) ? sourceArg : `${sourceArg}${extension}`;
  const candidates = [
    path.resolve(ROOT, sourceArg),
    path.resolve(ROOT, withExt),
    path.join(paths.CHAPTERS_DIR, sourceArg),
    path.join(paths.CHAPTERS_DIR, withExt),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(`Source file not found: ${sourceArg}`);
}

function humanizeTitle(filePath) {
  const base = path.basename(filePath, path.extname(filePath)).replace(/\.content$/i, '');
  return base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function dayFromSlug(slug) {
  const match = slug.match(/^(\d+)/);
  return match ? match[1].padStart(2, '0') : '01';
}

function setupBook({ slug, title, sourcePath, mode }) {
  const day = dayFromSlug(slug);
  const bookTitle = title || humanizeTitle(sourcePath);
  const sourceExt = mode === 'docx' ? '.docx' : '.pdf';
  const chapterFilename = `${slug}${sourceExt}`;

  clearChapterSources();
  fs.copyFileSync(sourcePath, path.join(paths.CHAPTERS_DIR, chapterFilename));

  const config = {
    id: `stringstack-${slug}`,
    slug,
    title: bookTitle,
    subtitle: `Day ${day} · StringStack.ai`,
    author: 'StringStack Content Team',
    publisher: 'StringStack.ai',
    coverColor: '#252525',
    accentColor: '#C6A43B',
    autoTitleFromFirstPdf: false,
    chapterSortMode: 'numbered',
    singleBookMode: true,
  };

  fs.writeFileSync(paths.CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  const manifest = writeManifest();

  manifest.title = bookTitle;
  if (manifest.chapters[0]) {
    manifest.chapters[0].title = bookTitle;
  }
  fs.writeFileSync(paths.MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const registry = readRegistry();
  const branch = `book/${slug}`;
  const existing = registry.books.find((book) => book.slug === slug);
  const entry = {
    slug,
    branch,
    title: bookTitle,
    source: chapterFilename,
    sessionLabel: `Day-${day} Session`,
    githubUrl: `https://github.com/udaymi8871/TextBook/tree/${branch}`,
    pagesUrl: `https://udaymi8871.github.io/TextBook/${slug}/`,
  };
  if (mode === 'pdf') entry.pdf = chapterFilename;
  if (mode === 'docx') entry.docx = chapterFilename;

  if (existing) Object.assign(existing, entry);
  else registry.books.push(entry);

  registry.books.sort((a, b) => a.slug.localeCompare(b.slug));
  writeRegistry(registry);

  return { manifest, branch, entry, bookTitle };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug || (!args.pdf && !args.docx)) {
    console.error(
      'Usage: node scripts/create-book-branch.mjs --slug java-fundamentals --docx "Java Fundamentals.docx" [--title "Java Fundamentals"] [--push]',
    );
    process.exit(1);
  }

  const mode = args.docx ? 'docx' : 'pdf';
  const sourcePath = resolveSourcePath(args.docx || args.pdf, mode === 'docx' ? '.docx' : '.pdf');
  // Keep original on disk if create-book clears chapters — copy to temp first
  const tempCopy = path.join(ROOT, `.tmp-book-source${path.extname(sourcePath)}`);
  fs.copyFileSync(sourcePath, tempCopy);

  const title = args.title || humanizeTitle(sourcePath);
  const branch = `book/${args.slug}`;

  run('git checkout main');
  try {
    run(`git checkout -B ${branch}`);
  } catch {
    run(`git checkout ${branch}`);
  }

  const { manifest, entry, bookTitle } = setupBook({
    slug: args.slug,
    title,
    sourcePath: tempCopy,
    mode,
  });

  fs.unlinkSync(tempCopy);

  if (!args.noCommit) {
    run(
      'git add content/book.config.json public/chapters public/api/book-manifest.json books/registry.json',
    );
    run(`git commit -m "Add book branch ${args.slug}: ${bookTitle}"`);
  }

  console.log('');
  console.log(`Book branch ready: ${branch}`);
  console.log(`  Title: ${manifest.title}`);
  console.log(`  Session: ${entry.sessionLabel}`);
  console.log(`  Source: public/chapters/${entry.source}`);
  console.log(`  GitHub: ${entry.githubUrl}`);
  console.log(`  Live:   ${entry.pagesUrl}`);
  console.log('');

  if (args.push) {
    run(`git push -u origin ${branch} --force-with-lease`);
    console.log(`Pushed ${branch} to origin`);
  } else {
    console.log(`Push with: git push -u origin ${branch} --force-with-lease`);
  }
}

main();
