// Phone preview: every page of the site side by side in phone-sized frames,
// with a switch between device sizes. Each frame scrolls on its own.
// Ported from the "Phone Preview" Claude Design component.
"use strict";

(() => {
  const SIZES = [{ label: 'iPhone 15', w: 393, h: 852 }, { label: 'Small Android', w: 360, h: 780 }, { label: 'iPhone SE', w: 375, h: 667 }];

  const sizesEl = document.querySelector('[data-sizes]');
  const screensEl = document.querySelector('[data-screens]');
  const PAGES = JSON.parse(screensEl.dataset.pages || '[]');

  const buttons = SIZES.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = s.label;
    b.style.cssText = 'font:inherit;font-size:14px;padding:10px 16px;border-radius:999px;cursor:pointer;border:1px solid rgba(238,235,228,0.18)';
    b.addEventListener('click', () => pick(i));
    sizesEl.appendChild(b);
    return b;
  });

  const frames = PAGES.map(p => {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;gap:16px';
    col.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px">' +
        '<span style="font-size:15px;font-weight:500"></span>' +
        '<a target="_blank" style="font-size:13px">Open ↗</a>' +
      '</div>' +
      '<div style="position:relative;padding:12px;box-sizing:border-box;border-radius:52px;background:#050505;box-shadow:0 0 0 1px #2c2c2a,0 30px 60px rgba(0,0,0,0.45)">' +
        '<div style="position:absolute;left:50%;top:22px;width:96px;height:26px;margin-left:-48px;border-radius:999px;background:#050505;z-index:2"></div>' +
        '<iframe style="display:block;border:0;border-radius:40px;background:#0f0f0e"></iframe>' +
      '</div>';
    col.querySelector('span').textContent = p.label;
    col.querySelector('a').href = p.src;
    const ifr = col.querySelector('iframe'); ifr.src = p.src; ifr.title = p.label;
    screensEl.appendChild(col);
    return { body: col.lastElementChild, ifr };
  });

  const pick = i => {
    const z = SIZES[i];
    buttons.forEach((b, k) => { b.style.background = k === i ? '#eeebe4' : 'transparent'; b.style.color = k === i ? '#0f0f0e' : '#eeebe4'; });
    frames.forEach(f => {
      f.body.style.width = (z.w + 24) + 'px'; f.body.style.height = (z.h + 24) + 'px';
      f.ifr.style.width = z.w + 'px'; f.ifr.style.height = z.h + 'px';
    });
  };
  pick(0);
})();
