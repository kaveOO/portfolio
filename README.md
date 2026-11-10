# Portfolio

Personal site built with [Astro](https://astro.build), from the "Lens Portfolio" Claude Design project.

```sh
npm install
npm run dev       # http://localhost:4321/, reloads as you edit (drafts visible)
npm run build     # static site in dist/ (drafts left out)
npm run preview   # serve dist/ locally
```

Astro is pinned to 7.4.1: 7.4.2+ needs Node 22.23.4 or newer.

## Deploying

Hosted on Vercel, connected to this GitHub repo: every push to `main` deploys, and
other branches get preview URLs. Vercel detects Astro on its own (build `npm run
build`, output `dist/`); `engines.node` in `package.json` pins Node 22.

The site is served at the domain root. Internal links go through `url()` from
`src/lib/paths.ts`, so moving under a sub-path only needs `base` in `astro.config.mjs`.

## Writing a note

Add a Markdown file to `src/content/notes/`. The file name becomes the URL:
`src/content/notes/my-first-note.md` → `/notes/my-first-note/`.

```md
---
title: My first note
date: 2026-10-26
tag: Building
description: One or two sentences shown under the title and used for search results.
draft: true          # optional: visible in `npm run dev`, left out of the build
readingTime: 6       # optional: minutes; worked out from the word count otherwise
---

Intro paragraph.

## A section

`##` headings make up the "On this page" list beside the note.
```

The note shows up on the Notes page, in the latest three on the home page, and
under "Related notes" on other notes (same tag first). Topic filters appear on
the Notes page once there are 10 notes.

Supported in the body: paragraphs, `##`/`###` headings, lists, links, `> quotes`,
inline `code`, fenced code blocks (with a language, e.g. ```` ```bash ````, to get
the label and Copy button), images (`![alt](./image.jpg)` with the file next to the
note; converted to WebP and lazy-loaded at build time), and figures with captions:

```html
<figure>
<img src="/images/rack.jpg" alt="…">
<figcaption>Caption.</figcaption>
</figure>
```

(`rack.jpg` is a file in `public/images/`, served as-is, not converted. Prefer the
Markdown image syntax when you can: those images get optimized.)

The two notes were brought over from kaveo.dev; their images are in
`src/content/notes/images/`. The "Now" line on the Notes page is in
`src/pages/notes/index.astro`.

## Adding a project case study

Add a Markdown file to `src/content/projects/` → `/work/<file-name>/`.
See `src/content/projects/assaultcube-dma.md` for a full example.

```md
---
title: My project
order: 2                 # position among case studies (1 = first)
year: 2026
context: Personal project
role: Solo               # optional
tags: [C, Kernel, WinDbg]
summary: One or two sentences under the title.
cover:                   # optional; files in public/images/
  src: images/my-project.webp
  avif: images/my-project.avif   # optional sharper version
  alt: What the screenshot shows
  width: 1920
  height: 1080
video: YouTubeVideoId    # optional; click-to-play "Demo" section
links:
  - label: Code on GitHub ↗
    href: https://github.com/…
results:                 # optional big numbers; leave out rather than guess
  - value: 0.3 ms
    label: per-frame read time
---

## Goal

## What I built

## What was hard
```

Each `##` section shows its heading on the left and the content on the right;
code blocks get the language label and Copy button.

The Work panels on the home page come from the design file, so a new project
also needs a panel there (ask me, or add it in Claude Design and sync). Link it to
its case study with `href="work/<file-name>/"`.

## Updating from the design

The landing page and the shared scripts are generated from the files in `design/`:

1. Copy the new `Lens Portfolio.dc.html`, `transitions.js`, `mobile-nav.js` and
   `scrollbar.js` from the Claude Design project into `design/`.
2. Run `npm run sync:design`. It rewrites `src/pages/index.astro`,
   `src/styles/home.css` and `src/scripts/{lens,transitions,mobile-nav,scrollbar}.js`.
   Don't edit those by hand.

The Notes, Note, 404 and phone-preview pages were ported by hand; update them
directly in `src/`.
