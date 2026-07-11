# StringStack.ai — Digital Book Reader

A premium digital textbook reader for the StringStack.ai EdTech platform. Students read study material as a single immersive book — not a PDF viewer.

## Features

- **Realistic book UI** — cover page, open-book spread, page-flip animations with shadows and curl
- **Dynamic chapters** — new PDF uploads append via manifest; no frontend redeploy
- **Continue reading** — auto-saves last page and chapter
- **Navigation** — prev/next, page jump, chapter TOC, keyboard arrows
- **Bookmarks** — save and jump to marked pages
- **Reading progress** — page count and percentage bar
- **Themes** — light, sepia, dark
- **Zoom** — 75%–150%
- **Fullscreen** — distraction-free reading
- **Responsive** — mobile (single page), tablet, desktop (flipbook spread)
- **Performance** — virtual page window, PDF cache, lazy rendering, preload buffer

## Tech Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Animation | Framer Motion, react-pageflip (StPageFlip) |
| PDF | PDF.js |
| Icons | Lucide React |

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

```
src/
├── components/
│   ├── book/           # Cover, pages, flipbook
│   ├── reader/         # Toolbar, search, modals
│   ├── sidebar/        # TOC, bookmarks, progress
│   ├── ui/             # Button, Modal, ProgressBar
│   ├── BookReaderApp.tsx
│   └── ReadingView.tsx
├── config/
│   └── theme.ts        # Brand + theme tokens
├── hooks/
│   ├── useBookData.ts
│   ├── useBookmarks.ts
│   ├── useReadingProgress.ts
│   ├── useTheme.ts
│   ├── useMediaQuery.ts
│   └── useVirtualPages.ts
├── services/
│   ├── bookApi.ts      # Manifest fetch + page flattening
│   ├── pdfService.ts   # PDF.js render + cache
│   └── progressStorage.ts
└── types/
    └── book.ts
public/
├── chapters/               # ← Drop daily PDFs here (auto-detected)
└── api/
    └── book-manifest.json  # Auto-generated — do not edit manually
content/
└── book.config.json        # Book title, colors, metadata
scripts/
├── buildManifest.mjs       # Scans chapters folder
└── vite-plugin-book-chapters.ts
```

## Adding New Chapters (Drop PDFs in Folder)

**No manifest editing. No frontend changes.**

1. Save your PDF in `public/chapters/`
2. Use a numbered filename for order:

```
public/chapters/
  01-introduction-to-java.pdf
  02-variables-and-data-types.pdf
  03-control-flow.pdf
  11-advanced-collections.pdf   ← new daily upload
```

3. The book updates automatically:
   - **Dev server** — detects the file instantly and refreshes the book
   - **Production build** — `npm run build` scans the folder before build

### Supported filename formats

| Filename | Chapter title |
|----------|---------------|
| `01-introduction.pdf` | Introduction |
| `Chapter 2 - Variables.pdf` | Variables |
| `loops-and-control-flow.pdf` | Loops And Control Flow |

### Book settings

Edit `content/book.config.json` for title, subtitle, and cover colors only.

```json
{
  "title": "Java Programming",
  "subtitle": "Complete Study Guide for Students",
  "coverColor": "#312e81",
  "accentColor": "#4f46e5"
}
```

## Production API (Optional)

For a hosted backend, point `fetchBookManifest()` in `src/services/bookApi.ts` to your API. The backend can run the same folder-scan logic from `scripts/buildManifest.mjs` whenever PDFs are uploaded.

```
GET /api/books/{bookId}/manifest
```

### Manifest Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Book identifier |
| `title` | string | Display title |
| `chapters[].pdfUrl` | string | URL to chapter PDF |
| `chapters[].order` | number | Sort order |
| `chapters[].pageCount` | number? | Optional; auto-detected if omitted |

## Performance (1000+ Pages)

1. **Virtual window** — only 10 flip DOM slots mounted (`useVirtualPages`)
2. **PDF page cache** — LRU cache of rendered ImageBitmaps (120 pages)
3. **Lazy render** — canvas draws only for active ±1 pages
4. **Preload buffer** — ±3 pages prefetched in background
5. **Document cache** — one PDFDocumentProxy per chapter URL

For very large books in production, pre-render PDF pages to WebP on the server and serve image URLs instead of client-side PDF.js.

## Search

The search UI is wired; connect to your full-text index backend. Replace mock results in `SearchOverlay.tsx`.

## License

Proprietary — StringStack.ai
