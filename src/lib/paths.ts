// The site is served under a base path (astro.config.mjs `base`), so internal links
// must include it: url('/notes/') → '/portfolio/notes/'.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const url = (path: string) => base + path;
