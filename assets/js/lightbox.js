// Project lightbox, shared by the hero reel and the work grid.
// Lightbox.open(index) shows PROJECTS[index]; fires a 'lightbox:change' event ({ detail: { open } }) on window.
(() => {
  const P = window.PROJECTS || [];
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const lbVideo = document.getElementById('lb-video');
  const lbTitle = document.getElementById('lb-title');
  const lbKind = document.getElementById('lb-kind');
  let isOpen = false, lastFocus = null;

  function announce() {
    dispatchEvent(new CustomEvent('lightbox:change', { detail: { open: isOpen } }));
    dispatchEvent(new Event('cursor:refresh'));
  }

  function open(i) {
    const p = P[i];
    if (!p) return;
    lbTitle.textContent = p.title;
    lbKind.textContent = window.projectMeta ? window.projectMeta(p) : p.kind;
    lbVideo.replaceChildren();
    lbVideo.classList.toggle('vertical', !!p.vertical);   // Shorts play in a tall 9:16 player
    if (p.youtube) {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(p.youtube)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
      f.title = p.title;
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      lbVideo.append(f);
    } else {
      const ph = document.createElement('div');
      ph.className = 'lb-placeholder';
      ph.style.background = `linear-gradient(135deg, ${p.tint[0]}, ${p.tint[1]})`;
      const s = document.createElement('span');
      s.textContent = 'Video placeholder. Add the YouTube ID in projects.js.';
      ph.append(s);
      lbVideo.append(ph);
    }
    if (!isOpen) lastFocus = document.activeElement;
    lb.hidden = false;
    isOpen = true;
    document.documentElement.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus({ preventScroll: true });
    announce();
  }

  function close() {
    if (!isOpen) return;
    lb.hidden = true;
    lbVideo.replaceChildren();
    isOpen = false;
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    announce();
  }

  lb.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  window.Lightbox = { open, close, get isOpen() { return isOpen; } };
})();
