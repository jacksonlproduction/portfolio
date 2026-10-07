// Focus Ball cursor — pairs with assets/css/cursor.css.
// Only runs on devices with a fine pointer (mouse / trackpad).
(() => {
  if (!matchMedia('(pointer: fine)').matches) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('has-cursor');

  const cur = document.createElement('div');
  cur.id = 'cur';
  cur.className = 'hidden';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<span class="hl"></span><span class="pt"></span><span class="tag"></span>';
  document.body.appendChild(cur);

  const hl = cur.querySelector('.hl'), pt = cur.querySelector('.pt'), tag = cur.querySelector('.tag');
  const BALL = 16;
  let mx = innerWidth / 2, my = innerHeight / 2, bx = mx, by = my, pbx = bx, pby = by;
  let tx = mx, ty = my, target = null, state = '';
  const s = { x: mx - BALL / 2, y: my - BALL / 2, w: BALL, h: BALL, r: BALL / 2 };

  const release = el => { if (el && el.hasAttribute('data-magnet')) el.style.transform = ''; };

  addEventListener('pointermove', e => {
    mx = e.clientX; my = e.clientY;
    cur.classList.remove('hidden');
    const t = e.target.closest ? e.target.closest('[data-cursor]') : null;
    if (t !== target) {
      release(target);
      target = t; state = t ? t.dataset.cursor : '';
      cur.classList.remove('s-link', 's-play', 's-drag');
      cur.classList.toggle('locked', !!t);
      if (t) { cur.classList.add('s-' + state); tag.textContent = t.dataset.label || ''; }
    }
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', () => { cur.classList.add('hidden'); release(target); });
  addEventListener('pointerdown', () => cur.classList.add('down'));
  addEventListener('pointerup', () => cur.classList.remove('down'));

  const lerp = (a, b, k) => a + (b - a) * k;

  function tick() {
    const kb = reduce ? 1 : .2;
    bx = lerp(bx, mx, kb); by = lerp(by, my, kb);
    const vx = bx - pbx, vy = by - pby; pbx = bx; pby = by;

    let goal;
    if (target && target.isConnected) {
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

    pt.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    tx = lerp(tx, mx, reduce ? 1 : .3); ty = lerp(ty, my, reduce ? 1 : .3);
    tag.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
