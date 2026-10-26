// Note page: reading progress bar, "On this page" table of contents with
// active-section tracking and eased scrolling, and a header with a Copy button on code blocks.
// Ported from the "Note" Claude Design component.

const THEME = { bg:'#0f0f0e', fg:'#eeebe4', mute:'#b3afa6', line:'rgba(238,235,228,0.14)', p1:'#29261f', code:'rgba(238,235,228,0.05)', accent:'#6e95ff' };

for (const k in THEME) document.documentElement.style.setProperty('--' + k, THEME[k]);

const bar = document.querySelector('[data-bar]');
const toc = document.querySelector('[data-toc]');
const links = toc ? Array.from(toc.querySelectorAll('a[href^="#"]')) : [];
const heads = links.map(a => document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))));
let active = -1, lock = null, sRaf = 0;

const setActive = a => {
  active = a;
  links.forEach((el, i) => {
    const c = i === a ? 'var(--fg,#eeebe4)' : 'var(--mute,#b3afa6)';
    el.style.color = c; el.firstElementChild.style.background = c;
    el.setAttribute('aria-current', i === a ? 'true' : 'false');
  });
};

const onScroll = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (bar) bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  let a = -1; heads.forEach((el, i) => { if (el && el.getBoundingClientRect().top < innerHeight * 0.35) a = i; });
  if (lock == null && a !== active) setActive(a);
};

const onResize = () => { if (toc) toc.hidden = innerWidth < 1180; };

const goTo = (e, i) => {
  const el = heads[i]; if (!el) return;
  e.preventDefault();
  const to = Math.max(0, el.getBoundingClientRect().top + scrollY - 100), from = scrollY, dist = to - from;
  history.replaceState(null, '', '#' + el.id);
  cancelAnimationFrame(sRaf);
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || Math.abs(dist) < 2) { scrollTo(0, to); return; }
  lock = i; setActive(i);
  const dur = Math.min(1100, Math.max(550, Math.abs(dist) * 0.45)), t0 = performance.now();
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const step = now => { const k = Math.min(1, (now - t0) / dur); scrollTo(0, from + dist * ease(k)); if (k < 1) sRaf = requestAnimationFrame(step); else { lock = null; onScroll(); } };
  const stop = () => { cancelAnimationFrame(sRaf); lock = null; removeEventListener('wheel', stop); removeEventListener('touchstart', stop); };
  addEventListener('wheel', stop, { passive: true, once: true }); addEventListener('touchstart', stop, { passive: true, once: true });
  sRaf = requestAnimationFrame(step);
};
links.forEach((a, i) => a.addEventListener('click', e => goTo(e, i)));

// Wrap each highlighted code block in the design's frame: language label + Copy button.
document.querySelectorAll('.prose pre').forEach(pre => {
  const fig = document.createElement('figure'); fig.className = 'code';
  const head = document.createElement('div'); head.className = 'code-head';
  const lang = document.createElement('span'); lang.className = 'code-lang'; lang.textContent = pre.dataset.language || 'code';
  const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'copy'; btn.textContent = 'Copy'; btn.setAttribute('aria-label', 'Copy code');
  head.append(lang, btn);
  pre.replaceWith(fig); fig.append(head, pre);
  let cpT = 0;
  btn.addEventListener('click', () => {
    const show = on => { btn.textContent = on ? 'Copied' : 'Copy'; btn.style.color = on ? 'var(--accent,#6e95ff)' : ''; };
    const done = () => { show(true); clearTimeout(cpT); cpT = setTimeout(() => show(false), 1800); };
    const text = (pre.querySelector('code') || pre).textContent.replace(/\n$/, '');
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
  });
});

addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onResize); onResize(); onScroll();
