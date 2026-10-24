// Note page: reading progress bar, "On this page" table of contents with
// active-section tracking and eased scrolling, and the code-block copy button.
// Ported from the "Note" Claude Design component.
"use strict";

(() => {
  const THEME = { bg:'#0f0f0e', fg:'#eeebe4', mute:'#b3afa6', line:'rgba(238,235,228,0.14)', p1:'#29261f', code:'rgba(238,235,228,0.05)', accent:'#6e95ff' };
  const CODE = 'svc=$(ls /srv | shuf -n1)\nrestic restore latest --include /srv/$svc --target /tmp/check\ndocker compose -f /tmp/check/srv/$svc/compose.yml up -d\ncurl -fsS http://localhost:$(cat /srv/$svc/.port) > /dev/null \\\n  && echo "ok: $svc" || echo "FAILED: $svc"';

  for (const k in THEME) document.documentElement.style.setProperty('--' + k, THEME[k]);

  const bar = document.querySelector('[data-bar]');
  const toc = document.querySelector('[data-toc]');
  const links = toc ? Array.from(toc.querySelectorAll('a[href^="#"]')) : [];
  const heads = links.map(a => document.getElementById(a.getAttribute('href').slice(1)));
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

  const onResize = () => {
    if (toc) toc.hidden = innerWidth < 1180;
    const mob = innerWidth < 700, b = document.querySelector('[data-brand]'), cv = document.querySelector('[data-cv]');
    if (b) b.textContent = mob ? 'AB' : 'Alban Billiette'; if (cv) cv.textContent = mob ? 'CV ↓' : 'Download CV ↓';
  };

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

  const copyBtn = document.querySelector('[data-copy]');
  let cpT = 0;
  if (copyBtn) copyBtn.addEventListener('click', () => {
    const show = on => { copyBtn.textContent = on ? 'Copied' : 'Copy'; copyBtn.style.color = on ? 'var(--accent,#6e95ff)' : 'var(--mute,#b3afa6)'; };
    const done = () => { show(true); clearTimeout(cpT); cpT = setTimeout(() => show(false), 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText(CODE).then(done, done); else done();
  });

  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onResize); onResize(); onScroll();
})();
