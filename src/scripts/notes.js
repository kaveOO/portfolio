// Notes index: entry count, plus topic filters once the list is long enough.
// Rows come from the notes collection (one <a class="row" data-tag="…"> per note).
// Ported from the "Notes" Claude Design component.

const THEME = { bg:'#0f0f0e', fg:'#eeebe4', mute:'#b3afa6', line:'rgba(238,235,228,0.14)', accent:'#6e95ff' };
const MIN_FOR_FILTERS = 10;

for (const k in THEME) document.documentElement.style.setProperty('--' + k, THEME[k]);

const rows = Array.from(document.querySelectorAll('a.row[data-tag]'));
const count = document.querySelector('[data-count]');
const group = document.querySelector('[data-filters]');

const show = cur => {
  let n = 0;
  rows.forEach(r => { const on = cur === 'All' || r.dataset.tag === cur; r.hidden = !on; if (on) n++; });
  if (count) count.textContent = String(n).padStart(2, '0') + (n === 1 ? ' entry' : ' entries');
  if (group) Array.from(group.children).forEach(b => {
    const on = b.textContent === cur;
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.style.background = on ? 'var(--fg,#eeebe4)' : 'transparent';
    b.style.color = on ? 'var(--bg,#0f0f0e)' : 'var(--fg,#eeebe4)';
  });
};

if (group && rows.length >= MIN_FOR_FILTERS) {
  JSON.parse(group.dataset.topics || '["All"]').forEach(label => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.style.cssText = 'font:inherit;font-size:14px;padding:10px 16px;min-height:44px;border-radius:999px;border:1px solid var(--line,rgba(238,235,228,0.14));cursor:pointer;transition:background .2s,color .2s';
    b.addEventListener('click', () => show(label));
    group.appendChild(b);
  });
  group.hidden = false;
}
show('All');
