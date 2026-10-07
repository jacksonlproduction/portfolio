// Fixed nav: checks what's underneath it and switches to dark text over light sections.
// Mark dark sections with data-dark.
(() => {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  let raf = 0;
  function check() {
    raf = 0;
    const y = nav.offsetHeight / 2;
    const stack = document.elementsFromPoint(innerWidth / 2, y);
    const under = stack.find(el => !nav.contains(el) && el.id !== 'cur' && !el.closest('#cur'));
    const dark = !!(under && under.closest('[data-dark]'));
    nav.classList.toggle('on-light', !dark);
    // over the hero the nav stays clear; over any other dark section it gets a frosted dark backing
    const overHero = !!(under && under.closest('.hero'));
    nav.classList.toggle('solid-dark', dark && !overHero);
    if (dark) nav.setAttribute('data-dark', ''); else nav.removeAttribute('data-dark');
  }
  const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  check();

  /* ───────── Phone menu ───────── */
  const menu = document.getElementById('menu');
  const btn = document.getElementById('menu-open');
  if (!menu || !btn) return;
  const setOpen = open => {
    menu.hidden = !open;
    document.documentElement.classList.toggle('menu-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  btn.addEventListener('click', () => setOpen(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setOpen(false); btn.focus(); } });
  matchMedia('(min-width: 641px)').addEventListener('change', e => { if (e.matches) setOpen(false); });
})();
