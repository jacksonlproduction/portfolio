// Project lightbox, shared by the hero reel and the work grid.
// Lightbox.open(index) shows PROJECTS[index]; fires a 'lightbox:change' event ({ detail: { open } }) on window.
(() => {
  const P = window.PROJECTS || [];
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  const lbVideo = document.getElementById('lb-video');
  const lbTitle = document.getElementById('lb-title');
  const lbKind = document.getElementById('lb-kind');
  const lbBlurb = document.getElementById('lb-blurb');
  const lbCta = document.getElementById('lb-cta');
  let isOpen = false, lastFocus = null, current = null;

  function announce() {
    dispatchEvent(new CustomEvent('lightbox:change', { detail: { open: isOpen } }));
    dispatchEvent(new Event('cursor:refresh'));
  }

  function open(i) {
    const p = P[i];
    if (!p) return;
    current = p;
    lbTitle.textContent = p.title;
    lbKind.textContent = window.projectMeta ? window.projectMeta(p) : p.kind;
    if (lbBlurb) { lbBlurb.textContent = p.blurb || ''; lbBlurb.hidden = !p.blurb; }
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

  // Close on the X, the backdrop, or any empty space around the video (not the video, text or buttons)
  lb.addEventListener('click', e => {
    if (e.target.closest('[data-close]') || !e.target.closest('.lb-video, .lb-meta > div, .lb-actions')) close();
  });

  // "Want one like this?": jump to the contact form with this project's type picked and a note started
  lbCta?.addEventListener('click', () => {
    if (!current) return;
    const detail = { title: current.title, kind: current.kind };
    const contact = document.getElementById('contact-form');
    if (contact) {
      close();
      dispatchEvent(new CustomEvent('contact:prefill', { detail }));
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      location.href = `index.html?like=${encodeURIComponent(detail.title)}&kind=${encodeURIComponent(detail.kind)}#contact`;
    }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  window.Lightbox = { open, close, get isOpen() { return isOpen; } };
})();
