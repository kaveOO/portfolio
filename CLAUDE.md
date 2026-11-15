# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Alban Billiette's portfolio at kaveo.dev: a static Astro 7.4.1 site (Node 22, pinned in `.node-version`).
Cloudflare Pages builds and deploys every push to `main`, so a push is a release.

## Commands

```sh
npm run dev          # http://localhost:4321, drafts visible
npm run build        # static site in dist/
npm run preview      # serve dist/
npm run sync:design  # regenerate the home page from design/ (run before build after editing design/)
```

There are no tests and no linter. `npm run build` is the check: it fails on content-schema errors.

## The home page is generated

`tools/sync-design.py` turns `design/Lens Portfolio.dc.html` (a Claude Design export) and `design/*.js` into:
`src/pages/index.astro`, `src/styles/home.css`, `src/scripts/lens.js`, `transitions.js`, `mobile-nav.js` and `scrollbar.js`.
These outputs are overwritten on every sync: edit the design files, then run `npm run sync:design`, and commit both.

- The script does exact-match replacements on the design and exits if a pattern is not found exactly once,
  so keep the structures it looks for (the `<helmet>` head scripts, the `class Component extends DCLogic`
  block, the `data-essay` Notes rows) intact.
- The three Notes rows on the home page are rendered from the latest notes. Everything else on the home page,
  including the Work cards and their links (`work/<slug>/`), is hand-written in the design file and is
  **not** read from `src/content/projects/`. Adding a case study means adding its card in the design too.
- The lens script in the design is written with several statements per line. A `//` comment in the middle
  of such a line silently comments out the rest of it; use `/* */` there.

## The lens (src/scripts/lens.js, from the design)

A WebGL glass bubble that refracts the page as you scroll. It doesn't sample pixels: it redraws the DOM text
inside the lens on a 2D canvas from computed styles, for every element marked `data-lens=""`, and places words
with Range rects. Consequences:
- New text that should show through the lens needs `data-lens=""`; restyling text means the canvas copy
  follows computed styles, so check the lens over it.
- Non-breaking spaces (U+00A0, written as the literal character in the design) are how wrapping is controlled
  in lists like the stack lines ("C&nbsp;· C++"): keep the dot at the end of a line, never at the start.
- `compressHTML: false` in `astro.config.mjs` is required: the hero relies on the spaces between inline word spans.
- The canvas only covers the lens's bounding box; its resolution is capped (`this.dpr`, 2x on touch screens).
- The hero full stop after "Billiette" and the dot over the i in "Let's build" are the lens itself, sized and
  placed from layout measurements in `layout()`.

Layering on the home page: `main[data-content]` is `position:fixed`, z-index 1, over the fixed footer
`[data-reveal]` (z-index 0), with a `[data-reveal-space]` spacer inside main. `main` has `pointer-events:none`
and its children `auto`, so the footer links stay clickable through it.

## Hand-written pages

- `src/layouts/Base.astro`: shell for every page. Head scripts (transitions, mobile nav, scrollbar) are emitted
  as plain non-module scripts so they run before first paint.
- `src/pages/work/[slug].astro` + `src/styles/project.css`: case studies from `src/content/projects/*.md`.
  A cover `images/x.webp` gets a phone-sized `images/x-1100.webp` (and `.avif`) automatically when that file
  exists in `public/images/`.
- `src/pages/notes/` + `note.css`/`notes.css`: notes from `src/content/notes/*.md` (images live next to them
  and get a srcset through `image: { layout: 'constrained' }`).
- `src/pages/preview.astro`: unlinked design tool showing pages in phone frames.
- Content fields are documented in `src/content.config.ts`. `draft: true` shows only in dev.
- Internal links go through `url()` from `src/lib/paths.ts` so a future `base` path keeps working.
- `public/_headers` (caching) and `public/_redirects` (old blog URLs → notes) are Cloudflare Pages config.

## Phones and tablets

Breakpoints used across the site: phone layout below 700px wide, and a phone held sideways is
`(max-height:500px) and (pointer:coarse)` (it gets the phone treatment in places, the desktop layout on the
home page). Touch screens get enlarged invisible `::after` hit areas on small links (`design/mobile-nav.js`).

## Writing rules for site content

- No em dashes anywhere on the site.
- RUSTORIGIN and RUSTAVEO are written in capitals when the name stands alone (the `caps` field does this).
- Never show player names, Steam IDs or IPs: anonymize text and blur screenshots.
- The RUSTORIGIN launcher is described as closed source; keep the case study's honest note on AI use.
