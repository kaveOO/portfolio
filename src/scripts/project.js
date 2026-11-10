// Case study: swap the demo poster for the YouTube player on click, so nothing loads from YouTube before that.
document.querySelectorAll('.video[data-video]').forEach(box => {
  const btn = box.querySelector('.video-play');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(box.dataset.video)}?autoplay=1`;
    f.title = box.dataset.title || 'Demo video';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.referrerPolicy = 'strict-origin-when-cross-origin';
    btn.replaceWith(f);
    f.focus();
  });
});
