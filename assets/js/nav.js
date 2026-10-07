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
})();
