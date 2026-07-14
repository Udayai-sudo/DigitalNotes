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

function clearChapterPdfs() {
  for (const file of fs.readdirSync(paths.CHAPTERS_DIR)) {
    if (file.toLowerCase().endsWith('.pdf')) {
      fs.unlinkSync(path.join(paths.CHAPTERS_DIR, file));
    }
  }
}

function resolvePdfPath(pdfArg) {
  const candidates = [
    path.resolve(ROOT, pdfArg),
    path.resolve(ROOT, `${pdfArg}.pdf`),
    path.join(paths.CHAPTERS_DIR, pdfArg),
    path.join(paths.CHAPTERS_DIR, `${pdfArg}.pdf`),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(`PDF not found: ${pdfArg}`);
}

function dayFromSlug(slug) {
  const match = slug.match(/^(\d+)/);
  return match ? match[1].padStart(2, '0') : '01';
}

function setupBook({ slug, title, pdfPath }) {
  const day = dayFromSlug(slug);
  const chapterFilename = `${slug}.pdf`;

  clearChapterPdfs();
  fs.copyFileSync(pdfPath, path.join(paths.CHAPTERS_DIR, chapterFilename));

  const config = {
    id: `stringstack-${slug}`,
    slug,
    title,
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

  const registry = readRegistry();
  const branch = `book/${slug}`;
  const existing = registry.books.find((book) => book.slug === slug);
  const entry = {
    slug,
    branch,
    title,
    pdf: chapterFilename,
    sessionLabel: `Day-${day} Session`,
    githubUrl: `https://github.com/udaymi8871/TextBook/tree/${branch}`,
  };

  if (existing) {
    Object.assign(existing, entry);
  } else {
    registry.books.push(entry);
  }

  registry.books.sort((a, b) => a.slug.localeCompare(b.slug));
  writeRegistry(registry);

  return { manifest, branch, entry };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.slug || !args.title || !args.pdf) {
    console.error('Usage: node scripts/create-book-branch.mjs --slug 01-demo-1 --title "Demo 1" --pdf Demo-1.pdf [--push]');
    process.exit(1);
  }

  const pdfPath = resolvePdfPath(args.pdf);
  const branch = `book/${args.slug}`;

  run('git checkout main');
  try {
    run(`git checkout -B ${branch}`);
  } catch {
    run(`git checkout ${branch}`);
  }

  const { manifest, entry } = setupBook({
    slug: args.slug,
    title: args.title,
    pdfPath,
  });

  if (!args.noCommit) {
    run('git add content/book.config.json public/chapters public/api/book-manifest.json books/registry.json');
    run(`git commit -m "Add book branch ${args.slug}: ${args.title}"`);
  }

  console.log('');
  console.log(`Book branch ready: ${branch}`);
  console.log(`  Title: ${manifest.title}`);
  console.log(`  Session: ${entry.sessionLabel}`);
  console.log(`  PDF: public/chapters/${entry.pdf}`);
  console.log(`  GitHub: ${entry.githubUrl}`);
  console.log('');

  if (args.push) {
    run(`git push -u origin ${branch}`);
    console.log(`Pushed ${branch} to origin`);
  } else {
    console.log(`Push with: git push -u origin ${branch}`);
  }
}

main();
