// Selected work: your top three up front, and every project behind "See all work" (filterable).
// Cards come from projects.js and have hover-to-preview. Clicking one opens the shared lightbox.
(() => {
  const grid = document.getElementById('work-grid');
  const allGrid = document.getElementById('work-all-grid');
  if (!grid || !allGrid) return;
  const P = window.PROJECTS || [];
  let TOP = P.filter(p => p.top).slice(0, 3);
  if (!TOP.length) TOP = P.slice(0, 3);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pad2 = n => String(n).padStart(2, '0');
  const plural = k => (/^(Social|Drone)$/.test(k) ? k : k + 's');

  /* ───────── Build cards ───────── */
  function makeCard(p, into, isTop) {
    const i = P.indexOf(p);
    const li = document.createElement('li');
    li.className = 'card rv';
    li.dataset.kind = p.kind;
    if (isTop && p.featured) li.classList.add('featured');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-link';
    btn.setAttribute('aria-label', `Watch ${p.title}, ${(window.projectMeta ? window.projectMeta(p, ['kind', 'year']) : p.kind).toLowerCase()}`);

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
    media.querySelector('.card-len').textContent = p.length || '';
    media.querySelector('.card-num').textContent = pad2(i + 1);
    if (p.stat) {
      const badge = document.createElement('span');
      badge.className = 'card-badge';
      badge.textContent = p.stat;
      media.append(badge);
    }

    const thumb = p.poster || (p.youtube ? `https://i.ytimg.com/vi/${encodeURIComponent(p.youtube)}/hqdefault.jpg` : '');
    if (thumb && p.vertical) {
      // Shorts: blurred thumbnail fills the card, the vertical frame stands in the middle like a phone
      media.classList.add('vertical');
      const bg = document.createElement('img');
      bg.src = thumb; bg.alt = ''; bg.loading = 'lazy'; bg.className = 'card-bg';
      const phone = document.createElement('span'); phone.className = 'card-phone';
      const fg = document.createElement('img');
      fg.src = thumb; fg.alt = ''; fg.loading = 'lazy';
      phone.append(fg);
      media.prepend(bg, phone);
    } else if (thumb) {
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
    meta.querySelector('.card-year').textContent = p.year || '';
    meta.querySelector('.card-kind').textContent = window.projectMeta ? window.projectMeta(p, ['client', 'kind']) : p.kind;

    // if a thumbnail can't load, hide it and let the tinted backdrop show instead of a broken image
    media.querySelectorAll('img').forEach(im => im.addEventListener('error', () => { im.style.display = 'none'; const ph = im.closest('.card-phone'); if (ph) ph.style.display = 'none'; }));
    btn.append(media, meta);
    li.append(btn);
    into.append(li);
    btn.addEventListener('click', () => window.Lightbox && window.Lightbox.open(i));
    return { p, i, li, media, video };
  }
  const topCards = TOP.map(p => makeCard(p, grid, true));
  const cards = P.map(p => makeCard(p, allGrid, false));   // the "All work" grid (filters act on these)
  const everyCard = topCards.concat(cards);

  /* ───────── Preview: hover on desktop, centre-of-screen on touch ───────── */
  // On desktop, a short rest on a card plays its real video in place: a muted YouTube loop (ytloop.js).
  const ytHover = canHover && !!window.YTLoop;
  function startYT(c) {
    if (!ytHover || c.yt || !c.p.youtube || c.p.preview) return;
    c.yt = window.YTLoop.create(c.p.youtube);
    const phone = c.media.querySelector('.card-phone');
    if (phone && phone.style.display !== 'none') phone.append(c.yt.el);
    else c.media.insertBefore(c.yt.el, c.media.querySelector('.card-leak'));   // above the thumbnail, under the tags
  }
  function stopYT(c) {
    clearTimeout(c.ytTimer);
    if (!c.yt) return;
    const y = c.yt;
    c.yt = null;
    y.el.classList.remove('live');
    setTimeout(() => y.destroy(), 400);
  }
  function play(c) {
    if (c.li.classList.contains('playing')) return;
    c.li.classList.add('playing');
    clearTimeout(c.ytTimer);
    c.ytTimer = setTimeout(() => startYT(c), 350);
    if (c.video) {
      if (!c.video.src) c.video.src = c.p.preview;
      c.video.play().catch(() => {});
    }
  }
  function stop(c) {
    c.li.classList.remove('playing');
    stopYT(c);
    if (c.video) c.video.pause();
  }
  if (canHover) {
    everyCard.forEach(c => {
      c.media.addEventListener('pointerenter', () => play(c));
      c.media.addEventListener('pointerleave', () => stop(c));
    });
  } else if (!reduce) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const c = everyCard.find(x => x.media === e.target);
        if (c) (e.isIntersecting ? play : stop)(c);
      });
    }, { rootMargin: '-42% 0px -42% 0px' });
    everyCard.forEach(c => io.observe(c.media));
  }

  addEventListener('lightbox:change', e => { if (e.detail.open) everyCard.forEach(stop); });

  // reveal the all-work cards in a gentle left-to-right ripple
  const rippleDelays = () => { let n = 0; cards.forEach(c => { if (!c.li.hidden) c.li.style.setProperty('--rd', `${(n++ % 3) * 0.08}s`); }); };
  rippleDelays();

  /* ───────── See all work ───────── */
  const allBox = document.getElementById('work-all');
  const allBtn = document.getElementById('work-all-btn');
  const allLabel = allBtn && allBtn.querySelector('.wa-label');
  const allCount = document.getElementById('work-all-count');
  if (allCount) allCount.textContent = P.length;
  if (allBtn && P.length <= TOP.length) allBtn.closest('.work-all-toggle').hidden = true;
  if (allBtn) allBtn.addEventListener('click', () => {
    const open = allBox.hidden;
    allBox.hidden = !open;
    allBtn.setAttribute('aria-expanded', String(open));
    allBtn.classList.toggle('open', open);
    if (allLabel) allLabel.textContent = open ? 'Show less' : 'See all work';
    dispatchEvent(new Event('cursor:refresh'));
    if (open) {
      if (!reduce) allBox.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
      allBox.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    } else {
      cards.forEach(stop);
      allBtn.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
  });

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
  if (count) count.textContent = TOP.length;
  if (kinds.length < 2) filters.hidden = true;   // nothing to filter yet

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
    rippleDelays();
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
