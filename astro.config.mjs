import { defineConfig } from 'astro/config';
import codeTheme from './src/lib/code-theme.mjs';

export default defineConfig({
  // Served by GitHub Pages as a project site; internal links go through url() in src/lib/paths.ts.
  site: 'https://kaveoo.github.io',
  base: '/portfolio',
  // The landing page relies on the spaces between inline word spans; keep HTML as written.
  compressHTML: false,
  markdown: {
    shikiConfig: { theme: codeTheme },
  },
  vite: {
    // Keep the head scripts (imported with ?url in Base.astro) as cacheable files, not data: URLs.
    build: { assetsInlineLimit: (file) => (file.endsWith('.js') ? false : undefined) },
  },
});
