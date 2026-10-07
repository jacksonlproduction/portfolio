// Gear: interactive line drawings (camera rig + drone) with hotspots, a detail panel and the full kit list.
// Data lives in gear-data.js.
(() => {
  const fig = document.getElementById('gear-figure');
  const G = window.GEAR;
  if (!fig || !G) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad2 = n => String(n).padStart(2, '0');
  const scenes = [...fig.querySelectorAll('.scene')];
  const sceneOf = id => scenes.find(s => s.dataset.scene === id);
  const partsIn = sc => G.parts.filter(p => p.scene === sc);

  const $ = id => document.getElementById(id);
  const body = $('gd-body'), nameEl = $('gd-name'), modelEl = $('gd-model'), noteEl = $('gd-note'), specsEl = $('gd-specs');
  const idxEl = $('gd-index'), totalEl = $('gd-total'), caption = $('gear-caption-scene');

  let scene = G.scenes[0].id;
  let selected = partsIn(scene)[0].id;

  /* ───────── Tabs ───────── */
  const tabs = G.scenes.map(sc => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('role', 'tab');
    b.dataset.scene = sc.id;
    b.dataset.cursor = 'link';
    b.textContent = sc.label;
    b.addEventListener('click', () => setScene(sc.id));
    $('gear-tabs').append(b);
    return b;
  });

  /* ───────── Hotspots ───────── */
  const spots = G.parts.map(p => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hs';
    b.dataset.part = p.id;
    b.dataset.cursor = 'link';
    b.style.left = `${p.at[0] / 10}%`;
    b.style.top = `${p.at[1] / 6}%`;
    b.setAttribute('aria-label', p.name);
    b.innerHTML = '<i></i><b></b>';
    b.querySelector('b').textContent = p.name;
    b.addEventListener('click', () => select(p.id));
    b.addEventListener('pointerenter', () => highlight(p.id));
    b.addEventListener('pointerleave', () => highlight(null));
    b.addEventListener('focus', () => highlight(p.id));
    b.addEventListener('blur', () => highlight(null));
    $('gear-hotspots').append(b);
    return b;
  });

  /* ───────── Kit list ───────── */
  G.kit.forEach(group => {
    const col = document.createElement('div');
    const h = document.createElement('h3');
    h.textContent = group.group;
    const ul = document.createElement('ul');
    group.items.forEach(([label, partId]) => {
      const li = document.createElement('li');
      if (partId) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.dataset.cursor = 'link';
        b.addEventListener('pointerenter', () => { const p = G.parts.find(x => x.id === partId); if (p && p.scene === scene) highlight(partId); });
        b.addEventListener('pointerleave', () => highlight(null));
        b.addEventListener('click', () => {
          const p = G.parts.find(x => x.id === partId);
          if (!p) return;
          if (p.scene !== scene) setScene(p.scene, partId);
          else select(partId);
          fig.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        });
        li.append(b);
      } else {
        li.textContent = label;
      }
      ul.append(li);
    });
    col.append(h, ul);
    $('kit').append(col);
  });

  /* ───────── State ───────── */
  function highlight(id) {
    const sc = sceneOf(scene);
    sc.classList.toggle('hl-on', !!id);
    sc.querySelectorAll('.part').forEach(g => g.classList.toggle('hl', g.dataset.part === id));
  }

  function render(animate) {
    const list = partsIn(scene);
    const i = list.findIndex(p => p.id === selected);
    const p = list[i];
    idxEl.textContent = pad2(i + 1);
    totalEl.textContent = pad2(list.length);
    const fill = () => {
      nameEl.textContent = p.name;
      modelEl.textContent = p.model;
      noteEl.textContent = p.note;
      specsEl.replaceChildren(...p.specs.map(([k, v]) => {
        const d = document.createElement('div');
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        d.append(dt, dd);
        return d;
      }));
    };
    if (animate && !reduce && body.animate) {
      body.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 160, easing: 'ease-in' })
        .finished.then(() => {
          fill();
          body.animate([{ opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'none' }],
            { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
        });
    } else fill();
    spots.forEach(s => s.classList.toggle('sel', s.dataset.part === selected));
    scenes.forEach(sc => sc.querySelectorAll('.part').forEach(g => g.classList.toggle('sel', g.dataset.part === selected)));
  }

  function select(id) {
    if (id === selected) return;
    selected = id;
    render(true);
  }

  function setScene(id, partId) {
    if (id === scene && !partId) return;
    const changed = id !== scene;
    scene = id;
    selected = partId || partsIn(id)[0].id;
    scenes.forEach(sc => sc.classList.toggle('active', sc.dataset.scene === id));
    tabs.forEach(t => t.setAttribute('aria-selected', t.dataset.scene === id ? 'true' : 'false'));
    tabs.forEach(t => t.setAttribute('aria-pressed', t.dataset.scene === id ? 'true' : 'false'));
    spots.forEach(s => s.classList.toggle('on-scene', G.parts.find(p => p.id === s.dataset.part).scene === id));
    caption.textContent = G.scenes.find(s => s.id === id).label;
    if (changed && fig.classList.contains('ready')) {
      // redraw the new drawing's lines each time you switch to it
      const sc = sceneOf(id);
      sc.classList.remove('drawn');
      void sc.getBoundingClientRect();
      requestAnimationFrame(() => sc.classList.add('drawn'));
    }
    render(changed || !!partId);
  }

  $('gd-prev').addEventListener('click', () => step(-1));
  $('gd-next').addEventListener('click', () => step(1));
  function step(d) {
    const list = partsIn(scene);
    const i = list.findIndex(p => p.id === selected);
    select(list[(i + d + list.length) % list.length].id);
  }

  setScene(scene, selected);
  render(false);

  // Draw the lines in the first time the drawing comes into view, then show the hotspots.
  const start = () => {
    sceneOf(scene).classList.add('drawn');
    scenes.forEach(sc => { if (sc.dataset.scene !== scene) sc.classList.add('drawn'); });
    setTimeout(() => fig.classList.add('ready'), reduce ? 0 : 1100);
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { start(); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(fig);
  } else start();
})();
