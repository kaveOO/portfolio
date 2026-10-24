(function () {
  if (window.__abT) return; window.__abT = 1;
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ease = 'cubic-bezier(.7,0,.2,1)';
  function mk(edge) {
    var o = document.createElement('div');
    o.setAttribute('aria-hidden', 'true'); o.setAttribute('data-ab-curtain', '');
    o.style.cssText = 'position:fixed;inset:0;z-index:100;pointer-events:none;background:var(--bg,#0f0f0e);will-change:transform;border-' + edge + ':1px solid var(--accent,#6e95ff)';
    document.body.appendChild(o); return o;
  }
  if (!rm && sessionStorage.getItem('ab-t') === '1') {
    sessionStorage.removeItem('ab-t');
    var o = mk('bottom');
    o.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], { duration: 650, delay: 120, easing: ease, fill: 'forwards' })
      .finished.then(function () { o.remove(); });
  }
  window.abGo = function (url) {
    if (rm) { location.href = url; return; }
    sessionStorage.setItem('ab-t', '1');
    var o = mk('top');
    o.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], { duration: 520, easing: ease, fill: 'forwards' })
      .finished.then(function () { location.href = url; });
  };
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank') return;
    var u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname === location.pathname || !/\.html$/.test(u.pathname)) return;
    e.preventDefault(); window.abGo(u.href);
  });
  addEventListener('pageshow', function (e) {
    if (e.persisted) document.querySelectorAll('[data-ab-curtain]').forEach(function (el) { el.remove(); });
  });
})();
