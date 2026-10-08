// Liquid Glass: the specular sheen on glass controls follows the pointer.
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const SEL = '.nav-cta, .nav-menu, .now-showing, .lb-close, .field-chips span, .chip, .board-btn, .pill, .site-nav .nav';
  let raf = 0, ev = null, lit = null;
  addEventListener('pointermove', e => { ev = e; if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  function update() {
    raf = 0;
    const el = ev.target.closest && ev.target.closest(SEL);
    if (lit && lit !== el) { lit.style.removeProperty('--gx'); lit.style.removeProperty('--gy'); }
    lit = el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', ((ev.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    el.style.setProperty('--gy', ((ev.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  }
})();
