# Daily PDF uploads — Content Team Guide

Drop new PDFs here every day. They are **automatically appended** to the book in linear order.

## Daily workflow

```
Day 1   →  upload  introduction.pdf          →  Book: Chapter 1
Day 2   →  upload  variables.pdf              →  Book: Ch 1 → Ch 2 (linear)
Day 3   →  upload  control-flow.pdf           →  Book: Ch 1 → Ch 2 → Ch 3
Day 11  →  upload  advanced-collections.pdf   →  Appended as Chapter 11
```

**No code changes. No manifest editing. Just drop the file.**

## How order works

Default mode: **`daily-append`** — chapters are ordered by upload date (first uploaded = first chapter, new uploads always go to the end).

Optional numbered filenames (also supported):

```
01-introduction.pdf
02-variables.pdf
11-advanced-collections.pdf
```

Optional date prefix:

```
2026-07-11-advanced-collections.pdf
```

## What students see

- All chapters appear as **one continuous book**
- Page 1 of Chapter 1 → last page of Chapter N in linear order
- Table of contents updates automatically
- New chapters trigger an in-app notification

## Production

Run `npm run sync-chapters` after uploading PDFs (or on each deploy).  
With `npm run dev`, changes are detected instantly.
