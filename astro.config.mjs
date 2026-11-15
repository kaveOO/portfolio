import { defineConfig } from 'astro/config';
import codeTheme from './src/lib/code-theme.mjs';

export default defineConfig({
  // Hosted on Cloudflare Pages at the domain root. If it ever moves under a sub-path, set `base` here:
  // internal links go through url() in src/lib/paths.ts and follow it.
  // The landing page relies on the spaces between inline word spans; keep HTML as written.
  compressHTML: false,
  // Note images get a srcset, so a phone downloads a size near its screen instead of the 2560px original.
  image: { layout: 'constrained' },
  markdown: {
    shikiConfig: { theme: codeTheme },
  },
  vite: {
    // Keep the head scripts (imported with ?url in Base.astro) as cacheable files, not data: URLs.
    build: { assetsInlineLimit: (file) => (file.endsWith('.js') ? false : undefined) },
  },
});
