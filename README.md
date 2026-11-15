# Alban Billiette · Portfolio

Personal site at [kaveo.dev](https://kaveo.dev): game security and full-stack work, case studies and notes.
Built with [Astro](https://astro.build), with a WebGL glass lens that refracts the page as you scroll.

![The portfolio hero: the name Alban Billiette in large type with a glass lens refracting the letters](.github/hero.jpg)

## Run it

```sh
npm install
npm run dev       # http://localhost:4321, drafts visible
npm run build     # static site in dist/
```

Astro is pinned to 7.4.1, which needs Node 22 (pinned in `.node-version`).

## Content

- **Notes:** Markdown in `src/content/notes/`. The file name is the URL (`/notes/<name>/`).
  Front matter: `title`, `date`, `tag`, optional `description` and `draft: true`.
- **Case studies:** Markdown in `src/content/projects/` (`/work/<name>/`).
  Every field is described in `src/content.config.ts`; the existing files are examples.
  The Work cards on the home page are written in the design file, so a new case study needs its card there too.
- **Home page:** generated from `design/Lens Portfolio.dc.html`. Edit the design file, then run
  `npm run sync:design`. Don't edit `src/pages/index.astro` or `src/scripts/lens.js` by hand.

## Deploy

Cloudflare Pages deploys every push to `main` (preset Astro, build `npm run build`, output `dist`).
`public/_headers` sets caching and `public/_redirects` maps the old blog URLs to the new notes.
