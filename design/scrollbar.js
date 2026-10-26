(function () {
  if (window.__abSB) return; window.__abSB = 1;
  var st = document.createElement('style');
  st.textContent = 'html{scrollbar-width:none;}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0;}';
  document.head.appendChild(st);
  function init() {
    var bar = document.createElement('div'), th = document.createElement('div'), drag = null, over = false;
    bar.setAttribute('aria-hidden', 'true');
    bar.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:16px;z-index:30;touch-action:none';
    th.style.cssText = 'position:absolute;right:4px;top:0;width:3px;height:60px;border-radius:999px;background:var(--fg,#eeebe4);opacity:0.35;transition:width .2s,opacity .2s,background-color .2s;will-change:transform';
    bar.appendChild(th); document.body.appendChild(bar);
    var H = 0, max = 0, h = 60;
    function hot(on) { th.style.width = on ? '6px' : '3px'; th.style.opacity = on ? '0.75' : '0.35'; }
    function upd() {
      H = innerHeight; max = Math.max(0, document.documentElement.scrollHeight - H);
      bar.style.display = max > 2 ? 'block' : 'none';
      h = Math.max(48, H * H / (max + H));
      th.style.height = h + 'px';
      th.style.transform = 'translate3d(0,' + (max ? scrollY / max * (H - h) : 0) + 'px,0)';
    }
    function move(e) { var t = Math.max(0, Math.min(H - h, e.clientY - drag)); scrollTo(0, t / Math.max(1, H - h) * max); }
    function up() { drag = null; th.style.background = ''; hot(over); bar.removeEventListener('pointermove', move); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); }
    bar.addEventListener('pointerenter', function () { over = true; hot(true); });
    bar.addEventListener('pointerleave', function () { over = false; if (drag == null) hot(false); });
    bar.addEventListener('pointerdown', function (e) {
      e.preventDefault(); bar.setPointerCapture(e.pointerId);
      var top = max ? scrollY / max * (H - h) : 0;
      drag = (e.clientY >= top && e.clientY <= top + h) ? e.clientY - top : h / 2;
      th.style.background = 'var(--accent,#6e95ff)';
      move(e);
      bar.addEventListener('pointermove', move); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
    });
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', upd);
    var ro = new ResizeObserver(upd), seen = new Set();
    function watch() { document.querySelectorAll('body > *, x-dc, x-dc > *').forEach(function (el) { if (!seen.has(el) && el !== bar) { seen.add(el); ro.observe(el); } }); }
    new MutationObserver(function () { watch(); upd(); }).observe(document.body, { childList: true, subtree: true });
    addEventListener('load', upd);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(upd);
    watch(); upd(); setTimeout(upd, 300); setTimeout(upd, 1200);
  }
  if (document.body) init(); else addEventListener('DOMContentLoaded', init);
})();
