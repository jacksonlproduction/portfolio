// About: a scrapbook table. Every piece can be picked up, dragged and tossed; "Shuffle the table" rescatters them.
// On touch screens a sideways drag picks a piece up, so vertical swipes still scroll the page.
(() => {
  const board = document.getElementById('board');
  if (!board) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const snaps = [...board.querySelectorAll('.snap')];
  const state = new Map();
  let z = 10;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  snaps.forEach(el => {
    el.style.zIndex = ++z;
    state.set(el, { dx: 0, dy: 0, r: parseFloat(getComputedStyle(el).getPropertyValue('--r')) || 0 });
  });

  function apply(el, tilt = 0) {
    const s = state.get(el);
    el.style.setProperty('--dx', `${s.dx.toFixed(1)}px`);
    el.style.setProperty('--dy', `${s.dy.toFixed(1)}px`);
    el.style.setProperty('--r', `${s.r.toFixed(2)}deg`);
    el.style.setProperty('--tilt', `${tilt.toFixed(2)}deg`);
  }

  // Keep pieces on the table: fully inside left/right (so they never cover the text beside it), mostly inside top/bottom.
  function bounds(el) {
    const W = board.clientWidth, H = board.clientHeight;
    const w = el.offsetWidth, h = el.offsetHeight, x = el.offsetLeft, y = el.offsetTop;
    return { minX: -x, maxX: Math.max(-x, W - x - w), minY: -y - h * 0.2, maxY: H - y - h * 0.7 };
  }

  let drag = null;
  snaps.forEach(el => {
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      const s = state.get(el);
      drag = { el, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx0: s.dx, dy0: s.dy, lastX: e.clientX, lastT: performance.now(), vx: 0 };
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = ++z;
      el.classList.remove('settling');
      el.classList.add('dragging');
      board.classList.add('touched');
    });
    el.addEventListener('pointermove', e => {
      if (!drag || drag.el !== el || e.pointerId !== drag.id) return;
      const s = state.get(el);
      const b = bounds(el);
      s.dx = clamp(drag.dx0 + (e.clientX - drag.x0), b.minX, b.maxX);
      s.dy = clamp(drag.dy0 + (e.clientY - drag.y0), b.minY, b.maxY);
      const now = performance.now();
      const v = (e.clientX - drag.lastX) / Math.max(8, now - drag.lastT);
      drag.vx = drag.vx * 0.6 + v * 0.4;
      drag.lastX = e.clientX; drag.lastT = now;
      apply(el, reduce ? 0 : clamp(drag.vx * 9, -14, 14)); // leans into the direction you move it
    });
    const end = e => {
      if (!drag || drag.el !== el) return;
      const s = state.get(el);
      if (!reduce) s.r = clamp(s.r + drag.vx * 6 + rand(-2, 2), -16, 16); // lands at a slightly new angle
      el.classList.remove('dragging');
      apply(el, 0);
      drag = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  });

  // Shuffle: rescatter everything across the table.
  document.getElementById('board-shuffle')?.addEventListener('click', () => {
    board.classList.add('touched');
    const order = [...snaps].sort(() => Math.random() - 0.5);
    order.forEach((el, k) => {
      const s = state.get(el);
      const b = bounds(el);
      s.dx = rand(Math.max(b.minX, -board.clientWidth * 0.25), Math.min(b.maxX, board.clientWidth * 0.25));
      s.dy = rand(Math.max(b.minY, -board.clientHeight * 0.2), Math.min(b.maxY, board.clientHeight * 0.2));
      s.r = rand(-12, 12);
      el.style.zIndex = ++z;
      el.classList.add('settling');
      el.style.transitionDelay = reduce ? '0s' : `${k * 0.04}s`;
      apply(el);
    });
    setTimeout(() => snaps.forEach(el => { el.style.transitionDelay = ''; el.classList.remove('settling'); }), 1400);
  });

  // Keep pieces on the table if the window size changes.
  addEventListener('resize', () => snaps.forEach(el => {
    const s = state.get(el), b = bounds(el);
    s.dx = clamp(s.dx, b.minX, b.maxX); s.dy = clamp(s.dy, b.minY, b.maxY);
    apply(el);
  }));

  // First time the table scrolls into view, the pieces drop onto it one by one.
  if (!reduce && board.animate) {
    snaps.forEach(el => { el.style.opacity = '0'; });
    let dropped = false;
    const check = () => {
      if (dropped || board.getBoundingClientRect().top > innerHeight * 0.7) return;
      dropped = true;
      removeEventListener('scroll', check);
      snaps.forEach((el, k) => {
        el.animate(
          [{ opacity: 0, translate: '0 -40px', scale: '1.25', filter: 'blur(4px)' }, { opacity: 1, translate: '0 0', scale: '1', filter: 'none' }],
          { duration: 700, delay: 120 + k * 90, easing: 'cubic-bezier(.2,.9,.25,1.05)', fill: 'backwards' }
        );
        el.style.opacity = ''; // the animation's backwards fill keeps it hidden until its turn
      });
    };
    addEventListener('scroll', check, { passive: true });
    check();
  }
})();
