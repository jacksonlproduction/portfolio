// Selected work: filterable grid of projects with hover-to-preview cards.
// Cards come from projects.js. Clicking one opens the shared lightbox.
(() => {
  const grid = document.getElementById('work-grid');
  if (!grid) return;
  const P = window.PROJECTS || [];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pad2 = n => String(n).padStart(2, '0');
  const plural = k => (/^(Social|Drone)$/.test(k) ? k : k + 's');

  /* ───────── Build cards ───────── */
  const cards = P.map((p, i) => {
    const li = document.createElement('li');
    li.className = 'card rv';
    li.dataset.kind = p.kind;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-link';
    btn.setAttribute('aria-label', `Watch ${p.title}, ${p.kind.toLowerCase()}, ${p.year}`);

    const media = document.createElement('div');
    media.className = 'card-media';
    media.dataset.cursor = 'play';
    media.dataset.label = 'Watch';
    media.style.setProperty('--a', p.tint[0]);
    media.style.setProperty('--b', p.tint[1]);
    media.innerHTML =
      '<span class="card-zoom"></span><span class="card-leak"></span><span class="card-grain"></span>' +
      '<span class="card-tag">Preview</span><span class="card-len"></span><span class="card-num"></span>' +
      '<span class="card-progress"><i></i></span>';
    media.querySelector('.card-len').textContent = p.length;
    media.querySelector('.card-num').textContent = pad2(i + 1);

    const thumb = p.poster || (p.youtube ? `https://i.ytimg.com/vi/${encodeURIComponent(p.youtube)}/hqdefault.jpg` : '');
    if (thumb) {
      const img = document.createElement('img');
      img.src = thumb; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      media.prepend(img);
    }
    let video = null;
    if (p.preview) {
      video = document.createElement('video');
      video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
      video.setAttribute('aria-hidden', 'true');
      video.addEventListener('playing', () => video.classList.add('ready'));
      media.prepend(video);
    }

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    meta.innerHTML = '<h3 class="card-title"></h3><p class="card-year"></p><p class="card-kind"></p>';
    meta.querySelector('.card-title').textContent = p.title;
    meta.querySelector('.card-year').textContent = p.year;
    meta.querySelector('.card-kind').textContent = p.kind;

    btn.append(media, meta);
    li.append(btn);
    grid.append(li);
    btn.addEventListener('click', () => window.Lightbox && window.Lightbox.open(i));
    return { p, i, li, media, video };
  });

  /* ───────── Preview: hover on desktop, centre-of-screen on touch ───────── */
  function play(c) {
    if (c.li.classList.contains('playing')) return;
    c.li.classList.add('playing');
    if (c.video) {
      if (!c.video.src) c.video.src = c.p.preview;
      c.video.play().catch(() => {});
    }
  }
  function stop(c) {
    c.li.classList.remove('playing');
    if (c.video) c.video.pause();
  }
  if (canHover) {
    cards.forEach(c => {
      c.media.addEventListener('pointerenter', () => play(c));
      c.media.addEventListener('pointerleave', () => stop(c));
    });
  } else if (!reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const c = cards.find(x => x.media === e.target);
        if (c) (e.isIntersecting ? play : stop)(c);
      });
    }, { rootMargin: '-42% 0px -42% 0px' });
    cards.forEach(c => io.observe(c.media));
  }

  /* ───────── Staggered two-column rhythm ───────── */
  function layoutOffsets() {
    let n = 0;
    cards.forEach(c => {
      if (c.li.hidden) return;
      c.li.classList.toggle('offset', n % 2 === 1);
      c.li.style.setProperty('--rd', `${(n % 2) * 0.12}s`);
      n++;
    });
    return n;
  }
  layoutOffsets();

  /* ───────── Filters ───────── */
  const filters = document.getElementById('work-filters');
  const count = document.getElementById('work-count');
  const kinds = [];
  P.forEach(p => { if (!kinds.includes(p.kind)) kinds.push(p.kind); });
  const tally = k => P.filter(p => k === 'all' || p.kind === k).length;
  const chips = ['all', ...kinds].map(k => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.kind = k;
    b.dataset.cursor = 'link';
    b.setAttribute('aria-pressed', k === 'all' ? 'true' : 'false');
    b.textContent = k === 'all' ? 'All' : plural(k);
    const sup = document.createElement('sup');
    sup.textContent = tally(k);
    b.append(sup);
    b.addEventListener('click', () => setFilter(k));
    filters.append(b);
    return b;
  });
  if (count) count.textContent = P.length;

  let current = 'all';
  function setFilter(k) {
    if (k === current) return;
    current = k;
    chips.forEach(b => b.setAttribute('aria-pressed', b.dataset.kind === k ? 'true' : 'false'));

    // FLIP: remember where visible cards were, change the layout, then animate from old to new spots.
    const before = new Map(cards.map(c => [c, c.li.hidden ? null : c.li.getBoundingClientRect()]));
    cards.forEach(c => {
      const show = k === 'all' || c.p.kind === k;
      c.li.hidden = !show;
      if (!show) stop(c);
      c.li.classList.add('in'); // never leave a re-shown card waiting for a scroll reveal
    });
    const shown = layoutOffsets();
    if (count) count.textContent = shown;
    if (reduce) return;
    cards.forEach(c => {
      if (c.li.hidden) return;
      const a = before.get(c);
      const b = c.li.getBoundingClientRect();
      if (!a) {
        c.li.animate(
          [{ opacity: 0, transform: 'translateY(40px) scale(.96)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'none' }],
          { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)', delay: 80 }
        );
      } else {
        const dx = a.left - b.left, dy = a.top - b.top;
        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          c.li.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
            { duration: 750, easing: 'cubic-bezier(.2,.8,.2,1)' }
          );
        }
      }
    });
  }
})();
