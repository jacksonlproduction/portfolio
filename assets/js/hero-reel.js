// Hero: an interactive 3D film reel built with Three.js.
// Each project from projects.js is one frame on a loop of 35mm film.
// Drag (or arrow keys) to spin, hover a frame to preview, click to open it.
(() => {
  const canvas = document.getElementById('reel');
  if (!canvas) return;
  const hero = canvas.closest('.hero');
  const glow = hero.querySelector('.hero-glow');
  const P = window.PROJECTS || [];
  const N = P.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad2 = n => String(n).padStart(2, '0');
  const mod = (a, n) => ((a % n) + n) % n;

  /* ───────── Lightbox ───────── */
  const lb = document.getElementById('lightbox');
  const lbVideo = document.getElementById('lb-video');
  const lbTitle = document.getElementById('lb-title');
  const lbKind = document.getElementById('lb-kind');
  let lbOpen = false, lastFocus = null;

  function openProject(i) {
    const p = P[i];
    lbTitle.textContent = p.title;
    lbKind.textContent = `${p.kind} · ${p.year} · ${p.length}`;
    lbVideo.replaceChildren();
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
    lastFocus = document.activeElement;
    lb.hidden = false;
    lbOpen = true;
    document.documentElement.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus({ preventScroll: true });
    dispatchEvent(new Event('cursor:refresh'));
  }
  function closeProject() {
    if (!lbOpen) return;
    lb.hidden = true;
    lbVideo.replaceChildren();
    lbOpen = false;
    document.documentElement.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    dispatchEvent(new Event('cursor:refresh'));
  }
  lb.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeProject(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeProject(); });

  /* ───────── Accessible list (and fallback when WebGL is missing) ───────── */
  const list = document.getElementById('reel-list');
  P.forEach((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.cursor = 'link';
    const t = document.createElement('b'); t.textContent = p.title;
    const k = document.createElement('i'); k.textContent = `${p.kind} · ${p.year}`;
    b.append(t, k);
    b.addEventListener('click', () => openProject(i));
    li.append(b);
    list.append(li);
  });

  /* ───────── "Now showing" label ───────── */
  const ns = document.querySelector('.now-showing');
  const nsIndex = document.getElementById('ns-index');
  const nsTitle = document.getElementById('ns-title');
  const nsKind = document.getElementById('ns-kind');
  document.getElementById('ns-total').textContent = pad2(N);
  let shown = -1;
  function setNow(i) {
    if (i === shown) return;
    shown = i;
    nsIndex.textContent = pad2(i + 1);
    nsTitle.textContent = P[i].title;
    nsKind.textContent = P[i].kind;
    ns.classList.remove('swap'); void ns.offsetWidth; ns.classList.add('swap');
  }
  setNow(0);

  /* ───────── WebGL setup ───────── */
  let renderer;
  try {
    if (!window.THREE) throw new Error('three missing');
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    hero.classList.add('no-webgl');
    canvas.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x050505, 8, 16);
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

  const R = 3.6;            // reel radius
  const H_BAND = 1.9;       // film height including sprocket edges
  const H_FRAME = 1.24;     // picture height
  const STEP = (Math.PI * 2) / N;
  const ARC = STEP * 0.88;  // picture width as an angle; the rest is the black gap between frames

  const tilt = new THREE.Group();   // overall attitude of the reel
  const spin = new THREE.Group();   // rotates around the reel's own axis
  tilt.add(spin);
  scene.add(tilt);
  const TILT = { x: 0.1, z: -0.09, y: -0.62 };
  tilt.rotation.set(TILT.x, 0, TILT.z);
  tilt.position.y = TILT.y;

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(3, 5, 8);
  scene.add(key);
  const rim = new THREE.PointLight(0xb3122e, 2.2, 14);
  rim.position.set(0, 0.4, -2);
  scene.add(rim);

  // Older Safari lacks canvas roundRect; plain rectangles are fine there.
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  }

  /* Film base: black stock with sprocket holes and edge markings, repeated once per frame. */
  function makeBandTexture() {
    const S = 512;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const g = c.getContext('2d');
    const m = Math.round(S * ((H_BAND - H_FRAME) / 2) / H_BAND); // edge height in px
    g.fillStyle = '#121212';
    g.fillRect(0, 0, S, S);
    g.fillStyle = '#0a0a0a';
    g.fillRect(0, m, S, S - m * 2);
    const holes = 5, hw = 34, hh = Math.round(m * 0.4), top = Math.round(m * 0.2);
    g.globalCompositeOperation = 'destination-out';
    for (let k = 0; k < holes; k++) {
      const x = (k + 0.5) * (S / holes) - hw / 2;
      g.beginPath(); g.roundRect(x, top, hw, hh, 6); g.fill();
      g.beginPath(); g.roundRect(x, S - top - hh, hw, hh, 6); g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = 'rgba(255, 196, 120, .42)';
    g.font = '600 15px Poppins, sans-serif';
    g.textBaseline = 'middle';
    const ty = S - m + (m - top - hh) / 2 - 2;
    g.fillText('JACKSON LURIA  ▸  500T', 18, ty);
    g.fillText('▸ 24', S - 64, m - (m - top - hh) / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(N, 1);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }
  const bandTex = makeBandTexture();
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, H_BAND, 160, 1, true, -STEP / 2, Math.PI * 2),
    new THREE.MeshStandardMaterial({ map: bandTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.42, metalness: 0.25 })
  );
  spin.add(band);

  /* Film grain, drawn over every frame. */
  const noise = document.createElement('canvas');
  noise.width = noise.height = 192;
  {
    const g = noise.getContext('2d');
    const d = g.createImageData(192, 192);
    for (let k = 0; k < d.data.length; k += 4) {
      const v = Math.random() * 255;
      d.data[k] = d.data[k + 1] = d.data[k + 2] = v;
      d.data[k + 3] = 255;
    }
    g.putImageData(d, 0, 0);
  }

  /* One frame per project. Front faces show the picture; back faces show it mirrored and dim, like light through film. */
  const FW = 640, FH = Math.round(640 * H_FRAME / (R * ARC));
  const frames = P.map((p, i) => {
    const c = document.createElement('canvas');
    c.width = FW; c.height = FH;
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const front = new THREE.Mesh(
      new THREE.CylinderGeometry(R + 0.006, R + 0.006, H_FRAME, 40, 1, true, -ARC / 2, ARC),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide })
    );
    const back = new THREE.Mesh(
      new THREE.CylinderGeometry(R - 0.006, R - 0.006, H_FRAME, 40, 1, true, -ARC / 2, ARC),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, color: 0x5a5a5a })
    );
    front.userData.index = i;
    const lift = new THREE.Group();
    lift.add(front, back);
    const pivot = new THREE.Group();
    pivot.rotation.y = i * STEP;
    pivot.add(lift);
    spin.add(pivot);
    const f = { p, i, c, g: c.getContext('2d'), tex, front, lift, pop: 0, play: 0, dim: 1, img: null };
    const src = p.poster || (p.youtube ? `https://i.ytimg.com/vi/${encodeURIComponent(p.youtube)}/hqdefault.jpg` : '');
    if (src) {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => { f.img = im; draw(f, performance.now() / 1000); };
      im.src = src;
    }
    return f;
  });
  const hitTargets = frames.map(f => f.front);

  function fitTitle(g, text, maxW) {
    const words = text.toUpperCase().split(' ');
    for (let size = 58; size >= 22; size -= 2) {
      g.font = `800 ${size}px "Akira Expanded", "Arial Black", sans-serif`;
      if (g.measureText(words.join(' ')).width <= maxW) return { size, lines: [words.join(' ')] };
      if (words.length > 1 && size <= 46) {
        let best = null;
        for (let k = 1; k < words.length; k++) {
          const a = words.slice(0, k).join(' '), b = words.slice(k).join(' ');
          const w = Math.max(g.measureText(a).width, g.measureText(b).width);
          if (w <= maxW && (!best || w < best.w)) best = { w, lines: [a, b] };
        }
        if (best) return { size, lines: best.lines };
      }
    }
    return { size: 22, lines: [text.toUpperCase()] };
  }

  function draw(f, t) {
    const { g, p, i } = f;
    const W = FW, H = FH, ph = f.play;
    if (f.img) {
      const s = Math.max(W / f.img.width, H / f.img.height);
      const w = f.img.width * s, h = f.img.height * s;
      g.drawImage(f.img, (W - w) / 2, (H - h) / 2, w, h);
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.fillRect(0, 0, W, H);
    } else {
      const gr = g.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, p.tint[0]);
      gr.addColorStop(1, p.tint[1]);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      // a drifting light leak stands in for footage
      const lx = W * (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 1.7)));
      const ly = H * (0.45 + 0.2 * Math.cos(t * 0.5 + i));
      const rg = g.createRadialGradient(lx, ly, 0, lx, ly, W * 0.55);
      rg.addColorStop(0, `rgba(255, 205, 185, ${0.08 + 0.2 * ph})`);
      rg.addColorStop(1, 'rgba(255, 205, 185, 0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, W, H);
    }
    // grain (it shimmers while playing)
    g.save();
    g.globalAlpha = 0.07 + 0.05 * ph;
    g.globalCompositeOperation = 'overlay';
    const ox = ph > 0.02 ? -Math.floor(Math.random() * 192) : 0, oy = ph > 0.02 ? -Math.floor(Math.random() * 192) : 0;
    for (let x = ox; x < W; x += 192) for (let y = oy; y < H; y += 192) g.drawImage(noise, x, y);
    g.restore();
    // vignette for legibility
    const vg = g.createLinearGradient(0, H * 0.35, 0, H);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = vg;
    g.fillRect(0, 0, W, H);

    g.textBaseline = 'alphabetic';
    g.textAlign = 'left';
    g.fillStyle = 'rgba(255,255,255,.6)';
    g.font = '500 17px Poppins, sans-serif';
    g.fillText(pad2(i + 1), 28, 42);
    g.textAlign = 'right';
    g.fillText(p.length, W - 28, 42);
    g.textAlign = 'left';

    const fit = fitTitle(g, p.title, W - 56);
    g.font = `800 ${fit.size}px "Akira Expanded", "Arial Black", sans-serif`;
    g.fillStyle = '#fff';
    const lh = fit.size * 0.98;
    const base = H - 74;
    fit.lines.forEach((ln, k) => g.fillText(ln, 26, base - (fit.lines.length - 1 - k) * lh));

    g.font = 'italic 400 27px "Apple Garamond", Garamond, serif';
    g.fillStyle = 'rgba(255,255,255,.78)';
    g.fillText(`${p.kind} · ${p.year}`, 28, H - 34);

    if (ph > 0.01) {
      const prog = (t * 0.07 + i * 0.137) % 1;
      g.fillStyle = `rgba(255,255,255,${0.18 * ph})`;
      g.fillRect(28, H - 16, W - 56, 2);
      g.fillStyle = `rgba(179,18,46,${ph})`;
      g.fillRect(28, H - 16, (W - 56) * prog, 2);
    }
    f.tex.needsUpdate = true;
  }

  frames.forEach(f => draw(f, 0));
  if (document.fonts && document.fonts.load) {
    Promise.all([
      '800 40px "Akira Expanded"', 'italic 400 24px "Apple Garamond"', '500 17px Poppins', '600 15px Poppins'
    ].map(s => document.fonts.load(s))).then(() => {
      frames.forEach(f => draw(f, 0));
      const nt = makeBandTexture();
      band.material.map = nt; band.material.needsUpdate = true; bandTex.dispose();
    }).catch(() => {});
  }

  /* ───────── Sizing ───────── */
  let W = 0, H = 0;
  function resize() {
    W = hero.clientWidth; H = hero.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const want = R * (camera.aspect < 1 ? 0.6 : 1.32);
    const dist = Math.max(9.5, want / (half * camera.aspect) + R);
    camera.position.set(0, 0.7, dist);
    camera.lookAt(0, -0.05, 0);
    camera.updateProjectionMatrix();
    scene.fog.near = dist - R * 0.3;
    scene.fog.far = dist + R * 1.7;
  }
  resize();
  addEventListener('resize', resize);

  /* ───────── Interaction ───────── */
  let angle = 0, target = 0, vel = 0;
  let dragging = false, lastX = 0, moved = 0, lastMoveT = 0, pressed = -1;
  let hovered = -1, pointerIn = false, lastInteract = performance.now();
  const mouse = new THREE.Vector2();
  const ray = new THREE.Raycaster();

  if (!reduce) { angle = target + 2.6; tilt.scale.setScalar(0.84); tilt.rotation.x = 0.55; }

  const snap = a => Math.round(a / STEP) * STEP;
  const frontIndex = () => mod(Math.round(-angle / STEP), N);
  function goTo(i, thenOpen) {
    let d = mod(-i * STEP - angle + Math.PI, Math.PI * 2) - Math.PI;
    target = angle + d;
    vel = 0;
    lastInteract = performance.now();
    if (thenOpen) setTimeout(() => openProject(i), reduce || Math.abs(d) < 0.01 ? 0 : 560);
  }

  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    pressed = hovered;   // remember which frame was under the pointer when the press started
    dragging = true; moved = 0; vel = 0;
    lastX = e.clientX; lastMoveT = performance.now();
    canvas.setPointerCapture(e.pointerId);
    lastInteract = performance.now();
  });
  canvas.addEventListener('pointermove', e => {
    pointerIn = true;
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved += Math.abs(dx);
    const d = dx * (Math.PI * 1.25) / Math.max(W, 1);
    angle += d;
    vel = vel * 0.4 + d * 0.6;
    lastMoveT = performance.now();
    lastInteract = lastMoveT;
  });
  const endDrag = e => {
    if (!dragging) return;
    dragging = false;
    if (performance.now() - lastMoveT > 90) vel = 0;
    if (moved < 6 && e.type === 'pointerup' && pressed >= 0) { vel = 0; goTo(pressed, true); return; }
    if (Math.abs(vel) < 0.002) { vel = 0; target = snap(angle); }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { pointerIn = false; });
  canvas.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); vel = 0; target = snap(target) - STEP; lastInteract = performance.now(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); vel = 0; target = snap(target) + STEP; lastInteract = performance.now(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(frontIndex()); }
  });

  /* ───────── Loop ───────── */
  const lerp = (a, b, k) => a + (b - a) * k;
  let running = true, raf = 0, prevAngle = angle, boost = 0, lastBoost = -1, tick = 0;

  function frame(nowMs) {
    raf = requestAnimationFrame(frame);
    const t = nowMs / 1000;
    tick++;

    // spin: drag → inertia → settle on a frame
    if (!dragging) {
      if (Math.abs(vel) > 0.0015) {
        angle += vel;
        vel *= 0.94;
        if (Math.abs(vel) <= 0.0015) { vel = 0; target = snap(angle); }
      } else {
        angle = lerp(angle, target, reduce ? 1 : 0.075);
      }
    }
    // autoplay: advance one frame every few seconds when nobody is touching it
    if (!reduce && !dragging && !lbOpen && hovered < 0 && vel === 0 &&
        Math.abs(target - angle) < 0.003 && nowMs - lastInteract > 4200) {
      target -= STEP;
      lastInteract = nowMs;
    }
    spin.rotation.y = angle;

    // intro settle
    tilt.scale.setScalar(lerp(tilt.scale.x, 1, 0.045));
    tilt.rotation.x = lerp(tilt.rotation.x, TILT.x, 0.045);

    // hover
    hovered = -1;
    if (pointerIn && !dragging && !lbOpen) {
      camera.updateMatrixWorld();
      ray.setFromCamera(mouse, camera);
      const hit = ray.intersectObjects(hitTargets, false)[0];
      if (hit) hovered = hit.object.userData.index;
    }
    const wantCursor = dragging ? 'drag' : hovered >= 0 ? 'play' : 'drag';
    const wantLabel = dragging ? 'Drag' : hovered >= 0 ? 'Play' : 'Drag';
    if (canvas.dataset.cursor !== wantCursor) canvas.dataset.cursor = wantCursor;
    if (canvas.dataset.label !== wantLabel) canvas.dataset.label = wantLabel;

    const fi = frontIndex();
    setNow(fi);
    const settled = Math.abs(target - angle) < 0.02 && !dragging && vel === 0;

    for (const f of frames) {
      const isHover = f.i === hovered;
      f.pop = lerp(f.pop, isHover ? 1 : 0, 0.12);
      f.lift.position.z = f.pop * 0.2;
      f.lift.scale.setScalar(1 + f.pop * 0.035);
      f.dim = lerp(f.dim, hovered >= 0 && !isHover ? 0.5 : 1, 0.1);
      f.front.material.color.setScalar(f.dim);
      const wantPlay = isHover || (hovered < 0 && settled && f.i === fi) ? 1 : 0;
      f.play = lerp(f.play, wantPlay, 0.08);
      if (f.play > 0.01 && tick % 2 === 0) draw(f, t);
      else if (f.play <= 0.01 && f.play > 0.0005) { f.play = 0; draw(f, t); }
    }

    // glow reacts to spin speed and hover
    const speed = Math.abs(angle - prevAngle);
    prevAngle = angle;
    boost = lerp(boost, Math.min(1, speed * 22 + (hovered >= 0 ? 0.35 : 0)), 0.08);
    if (Math.abs(boost - lastBoost) > 0.01) { glow.style.setProperty('--boost', boost.toFixed(3)); lastBoost = boost; }

    renderer.render(scene, camera);
  }

  function setRunning(on) {
    if (on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(frame);
    else cancelAnimationFrame(raf);
  }
  raf = requestAnimationFrame(frame);
  let onScreen = true;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; setRunning(onScreen && !document.hidden); }).observe(hero);
  document.addEventListener('visibilitychange', () => setRunning(onScreen && !document.hidden));
})();
