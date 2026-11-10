// Internal links go through url() so they follow astro.config.mjs `base` if one is set:
// with base '/portfolio', url('/notes/') → '/portfolio/notes/'. Without one it's a no-op.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const url = (path: string) => base + path;
