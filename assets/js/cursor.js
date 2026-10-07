// Focus Ball cursor — pairs with assets/css/cursor.css.
// Only runs on devices with a fine pointer (mouse / trackpad).
// Add data-cursor-float to a large element (like the hero canvas) to show only the label, with no outline.
(() => {
  if (!matchMedia('(pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('has-cursor');

  const cur = document.createElement('div');
  cur.id = 'cur';
  cur.className = 'hidden';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<span class="hl"></span><span class="pt"></span><span class="tag"><span class="tag-t"></span></span><span class="tag-measure"></span>';
  document.body.appendChild(cur);

  const hl = cur.querySelector('.hl'), pt = cur.querySelector('.pt'), tag = cur.querySelector('.tag');
  const tagT = tag.querySelector('.tag-t'), meas = cur.querySelector('.tag-measure');
  const BALL = 16;
  let mx = innerWidth / 2, my = innerHeight / 2, bx = mx, by = my, pbx = bx, pby = by;
  let tx = mx, ty = my, ptx = tx, pty = ty, target = null, state = '';
  // Label pill: springs for "how shown" (a) and width (w), so every change morphs instead of snapping.
  let label = '', aT = 0, a = 0, av = 0, wT = BALL, w = BALL, wv = 0, lastT = 0;

  function setLabel(text, show) {
    const wasHidden = aT === 0 && a < 0.2;
    aT = show && text ? 1 : 0;
    if (show && wasHidden) { tx = bx; ty = by; }             // grow out of the ball, wherever it is
    if (!text || text === label) return;
    meas.textContent = text;
    wT = meas.offsetWidth + 28;
    if (a > 0.3 && !reduce && tagT.animate) {
      tagT.animate([{ opacity: 0, filter: 'blur(4px)', transform: 'translateY(3px)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }],
        { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
    tagT.textContent = text;
    label = text;
  }
  const s = { x: mx - BALL / 2, y: my - BALL / 2, w: BALL, h: BALL, r: BALL / 2 };

  const release = el => { if (el && el.hasAttribute('data-magnet')) el.style.transform = ''; };

  // Work out what's under the pointer. Elements like the 3D reel change data-cursor / data-label
  // while hovered, so those are compared too, not just the element.
  function evaluate(el) {
    cur.classList.toggle('on-dark', !!(el && el.closest && el.closest('[data-dark]')));
    const t = el && el.closest ? el.closest('[data-cursor]') : null;
    const nextState = t ? t.dataset.cursor : '';
    const nextLabel = t ? t.dataset.label || '' : '';
    if (t !== target || nextState !== state || nextLabel !== label) {
      if (t !== target) release(target);
      target = t; state = nextState;
      cur.classList.remove('s-link', 's-play', 's-drag');
      cur.classList.toggle('locked', !!t);
      cur.classList.toggle('float', !!t && t.hasAttribute('data-cursor-float'));
      if (t) cur.classList.add('s-' + state);
      setLabel(nextLabel, !!t && (state === 'play' || state === 'drag'));
    }
  }

  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    cur.classList.remove('hidden');
    evaluate(e.target);
  }, { passive: true });
  // Call this after opening or closing an overlay so the cursor re-checks what it's over.
  addEventListener('cursor:refresh', () => requestAnimationFrame(() => evaluate(document.elementFromPoint(mx, my))));
  document.documentElement.addEventListener('mouseleave', () => { cur.classList.add('hidden'); release(target); });
  addEventListener('pointerdown', () => cur.classList.add('down'));
  addEventListener('pointerup', () => cur.classList.remove('down'));

  const lerp = (a, b, k) => a + (b - a) * k;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function tick(now) {
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
    lastT = now;
    const kb = reduce ? 1 : .2;
    bx = lerp(bx, mx, kb); by = lerp(by, my, kb);
    const vx = bx - pbx, vy = by - pby; pbx = bx; pby = by;

    let goal;
    if (target && target.isConnected && target.hasAttribute('data-cursor-float')) {
      // Big canvases: don't frame the element, shrink the ball away and let the label do the talking.
      goal = { x: mx, y: my, w: 0, h: 0, r: 0 };
    } else if (target && target.isConnected) {
      const r = target.getBoundingClientRect();
      const pad = state === 'link' ? 6 : 8;
      const rad = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0;
      let ox = 0, oy = 0;
      if (target.hasAttribute('data-magnet') && !reduce) {
        const dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height / 2);
        target.style.transform = `translate(${dx * .18}px, ${dy * .28}px)`;
        ox = dx * .1; oy = dy * .14;
      }
      goal = { x: r.left - pad + ox, y: r.top - pad + oy, w: r.width + pad * 2, h: r.height + pad * 2, r: Math.min(rad + pad, (r.height + pad * 2) / 2) };
    } else {
      goal = { x: bx - BALL / 2, y: by - BALL / 2, w: BALL, h: BALL, r: BALL / 2 };
    }

    const k = reduce ? 1 : .2;
    s.x = lerp(s.x, goal.x, k); s.y = lerp(s.y, goal.y, k);
    s.w = lerp(s.w, goal.w, k); s.h = lerp(s.h, goal.h, k); s.r = lerp(s.r, goal.r, k);

    // Stretch only while it's a ball; it fades out as the ball grows into a highlight.
    const ballness = Math.max(0, Math.min(1, (40 - s.w) / 24));
    const sp = Math.min(Math.hypot(vx, vy), 40);
    const st = reduce || target ? 1 : 1 + (sp / 26) * ballness;
    const ang = Math.atan2(vy, vx) * 180 / Math.PI;
    const press = cur.classList.contains('down') ? .94 : 1;

    hl.style.width = s.w + 'px';
    hl.style.height = s.h + 'px';
    hl.style.borderRadius = s.r + 'px';
    hl.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${st > 1.01 ? ang : 0}deg) scale(${st * press}, ${press / Math.sqrt(st)})`;
    // a touch of motion blur on the ball when it moves fast
    const hb = reduce || target ? 0 : Math.min(1.6, sp * 0.05);
    hl.style.filter = hb > 0.15 ? `blur(${hb.toFixed(2)}px)` : '';

    pt.style.transform = `translate3d(${mx}px, ${my}px, 0)`;

    // Label pill: springy show/hide and width, follows the pointer, stretches + blurs along its motion.
    if (reduce) { a = aT; w = wT; }
    else {
      av += ((aT - a) * 230 - av * 21) * dt; a += av * dt;      // slightly under-damped: a soft overshoot
      wv += ((wT - w) * 260 - wv * 26) * dt; w += wv * dt;
    }
    tx = lerp(tx, mx, reduce ? 1 : .28); ty = lerp(ty, my, reduce ? 1 : .28);
    const A = clamp(a, 0, 1.15), grow = Math.min(1, A);
    const pw = BALL + (w - BALL) * grow, ph = BALL + 12 * grow;
    const tvx = tx - ptx, tvy = ty - pty; ptx = tx; pty = ty;
    const tsp = Math.min(Math.hypot(tvx, tvy), 60);
    const tang = Math.atan2(tvy, tvx) * 180 / Math.PI;
    const stretch = reduce ? 0 : Math.min(0.14, tsp * 0.005);
    const tpress = cur.classList.contains('down') ? 0.92 : 1;
    tag.style.width = `${pw.toFixed(1)}px`;
    tag.style.height = `${ph.toFixed(1)}px`;
    tag.style.translate = `${(tx - pw / 2).toFixed(1)}px ${(ty - ph / 2).toFixed(1)}px`;
    tag.style.transform = `rotate(${tang}deg) scale(${(1 + stretch) * tpress * (A > 1 ? A : 1)}, ${(1 - stretch * 0.4) * tpress}) rotate(${-tang}deg)`;
    tag.style.opacity = clamp(A * 3, 0, 1).toFixed(3);
    const tb = reduce ? 0 : Math.min(2.4, tsp * 0.07) + (1 - grow) * 3 * (A > 0.02 ? 1 : 0);
    tag.style.filter = tb > 0.15 ? `blur(${tb.toFixed(2)}px)` : '';
    tagT.style.opacity = clamp((A - 0.45) / 0.45, 0, 1).toFixed(3);

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
