// Hero: an interactive 3D film reel built with Three.js.
// Each project from projects.js is one frame on a loop of 35mm film.
// Drag (or arrow keys) to spin, hover a frame to preview, click to open it.
(() => {
  const canvas = document.getElementById('reel');
  if (!canvas) return;
  const hero = canvas.closest('.hero');
  // The reel needs enough frames to look like a loop of film, so short project lists repeat around it.
  // P = frames on the reel (each remembers its project as _i); SRC = the real projects.
  const SRC = window.PROJECTS || [];
  const P = [];
  const reps = SRC.length ? Math.max(1, Math.ceil(9 / SRC.length)) : 0;
  for (let r = 0; r < reps; r++) SRC.forEach((p, k) => P.push(Object.assign({}, p, { _i: k })));
  const N = P.length;
  const meta = window.projectMeta || (p => p.kind);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad2 = n => String(n).padStart(2, '0');
  const mod = (a, n) => ((a % n) + n) % n;

  /* ───────── "Spin me" hint ─────────
     Shows a few seconds after load, fades after a while, and drifts back (fainter, with longer gaps)
     while nobody has touched the reel. Any reel interaction or scrolling the page retires it for good. */
  const hint = document.getElementById('spin-hint');
  const HINT_ON = 5000;                     // how long each appearance stays
  const HINT_GAPS = [9000, 15000, 24000];   // rests before each comeback; then it stops for good
  let hintState = hint ? 'waiting' : 'gone', hintGoneAt = 0, wiggleStart = 0, hintRound = 0;
  let hintNextAt = performance.now() + (reduce ? 400 : 2300);
  function showHint(nowMs) {
    hintState = 'shown';
    hintNextAt = nowMs + HINT_ON;
    hint.classList.remove('show', 'rest', 'hide');
    void hint.offsetWidth;                  // restart the pop-in animation
    hint.classList.toggle('again', hintRound > 0);
    hint.classList.add('show');
    wiggleStart = nowMs;
  }
  function restHint(nowMs) {
    hintState = 'resting';
    hintGoneAt = nowMs;
    hint.classList.remove('show');
    hint.classList.add('rest');
    hintNextAt = hintRound < HINT_GAPS.length ? nowMs + HINT_GAPS[hintRound++] : Infinity;
  }
  function dismissHint() {
    if (hintState === 'gone') return;
    const wasShown = hintState === 'shown';
    hintState = 'gone';
    wiggleStart = 0;
    if (!wasShown) return;
    hintGoneAt = performance.now();
    hint.classList.remove('show');
    hint.classList.add('hide');
  }

  /* ───────── Lightbox (lives in lightbox.js, shared with the work grid) ───────── */
  let lbOpen = false;
  const openProject = i => { dismissHint(); window.Lightbox.open(P[i]._i); };
  addEventListener('lightbox:change', e => {
    lbOpen = e.detail.open;
    if (lbOpen) dismissHint();
    if (typeof syncRunning === 'function') syncRunning();
  });

  /* ───────── Accessible list (and fallback when WebGL is missing) ───────── */
  const list = document.getElementById('reel-list');
  SRC.forEach((p, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.cursor = 'link';
    const t = document.createElement('b'); t.textContent = p.title;
    const k = document.createElement('i'); k.textContent = meta(p, ['client', 'kind', 'year']);
    b.append(t, k);
    b.addEventListener('click', () => { dismissHint(); window.Lightbox.open(i); });
    li.append(b);
    list.append(li);
  });

  /* ───────── "Now showing" label ───────── */
  const ns = document.querySelector('.now-showing');
  const nsIndex = document.getElementById('ns-index');
  const nsTitle = document.getElementById('ns-title');
  const nsKind = document.getElementById('ns-kind');
  document.getElementById('ns-total').textContent = pad2(SRC.length);
  let shown = -1;
  function setNow(i) {
    if (i === shown) return;
    shown = i;
    nsIndex.textContent = pad2(P[i]._i + 1);
    nsTitle.textContent = P[i].title;
    nsKind.textContent = meta(P[i], ['client', 'kind']);
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
    if (hint) hint.remove();
    hintState = 'gone';
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
  const TILT = { x: 0.1, z: -0.09, y: -0.7 };
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
  /* Motion blur: pictures and film edge smear along the direction of spin, scaled by speed.
     Injected into Three's own materials so lighting, fog and colour handling stay the same. */
  const blurFrame = { value: 0 }, blurBand = { value: 0 };
  function addBlur(mat, uniform) {
    mat.onBeforeCompile = sh => {
      sh.uniforms.uBlur = uniform;
      sh.fragmentShader = 'uniform float uBlur;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
#ifdef USE_MAP
  vec4 sampledDiffuseColor;
  if (uBlur < 0.0005) {
    sampledDiffuseColor = texture2D(map, vUv);
  } else {
    sampledDiffuseColor = vec4(0.0);
    for (int k = 0; k < 12; k++) {
      float o = (float(k) / 11.0 - 0.5) * uBlur;
      sampledDiffuseColor += texture2D(map, vUv + vec2(o, 0.0));
    }
    sampledDiffuseColor /= 12.0;
  }
  diffuseColor *= sampledDiffuseColor;
#endif`);
    };
    mat.customProgramCacheKey = () => 'reel-blur';
    return mat;
  }

  const bandTex = makeBandTexture();
  const band = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, H_BAND, 160, 1, true, -STEP / 2, Math.PI * 2),
    addBlur(new THREE.MeshStandardMaterial({ map: bandTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.42, metalness: 0.25 }), blurBand)
  );
  spin.add(band);

  /* Film grain: three pre-baked layers cycled while a frame plays (cheap to draw, no blend modes). */
  const FW = 640, FH = Math.round(640 * H_FRAME / (R * ARC));
  const grains = [0, 1, 2].map(() => {
    const c = document.createElement('canvas');
    c.width = FW; c.height = FH;
    const g = c.getContext('2d');
    const d = g.createImageData(FW, FH);
    for (let k = 0; k < d.data.length; k += 4) {
      const v = Math.random() < 0.5 ? 0 : 255;
      d.data[k] = d.data[k + 1] = d.data[k + 2] = v;
      d.data[k + 3] = Math.random() * 30;
    }
    g.putImageData(d, 0, 0);
    return c;
  });

  /* One frame per project. Front faces show the picture; back faces show it mirrored and dim, like light through film. */
  const frames = P.map((p, i) => {
    const c = document.createElement('canvas');
    c.width = FW; c.height = FH;
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const front = new THREE.Mesh(
      new THREE.CylinderGeometry(R + 0.006, R + 0.006, H_FRAME, 40, 1, true, -ARC / 2, ARC),
      addBlur(new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide }), blurFrame)
    );
    const back = new THREE.Mesh(
      new THREE.CylinderGeometry(R - 0.006, R - 0.006, H_FRAME, 40, 1, true, -ARC / 2, ARC),
      addBlur(new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, color: 0x5a5a5a }), blurFrame)
    );
    front.userData.index = i;
    const lift = new THREE.Group();
    lift.add(front, back);
    const pivot = new THREE.Group();
    pivot.rotation.y = i * STEP;
    pivot.add(lift);
    spin.add(pivot);
    const f = { p, i, c, g: c.getContext('2d'), tex, front, lift, pop: 0, play: 0, dim: 1, img: null, bg: null, fg: null, lastDraw: 0 };
    const src = p.poster || (p.youtube ? `https://i.ytimg.com/vi/${encodeURIComponent(p.youtube)}/hqdefault.jpg` : '');
    if (src) {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => { f.img = im; bake(f); draw(f, performance.now() / 1000); };
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

  // Static layers for each frame, rebuilt only when fonts or a poster image arrive.
  function bake(f) {
    const { p, i } = f;
    const W = FW, H = FH;
    f.bg = f.bg || document.createElement('canvas');
    f.fg = f.fg || document.createElement('canvas');
    f.bg.width = f.fg.width = W;
    f.bg.height = f.fg.height = H;
    const b = f.bg.getContext('2d');
    if (f.img && p.vertical) {
      // Shorts: blurred fill behind, the 9:16 picture (centre of the thumbnail) standing in the middle
      const iw = f.img.width, ih = f.img.height, s = Math.max(W / iw, H / ih);
      b.filter = 'blur(18px) brightness(.55)';
      b.drawImage(f.img, (W - iw * s) / 2, (H - ih * s) / 2, iw * s, ih * s);
      b.filter = 'none';
      const cw = ih * 9 / 16, ph = H * 0.84, pw = ph * 9 / 16;
      b.save();
      b.beginPath(); b.roundRect((W - pw) / 2, (H - ph) / 2, pw, ph, 14); b.clip();
      b.drawImage(f.img, (iw - cw) / 2, 0, cw, ih, (W - pw) / 2, (H - ph) / 2, pw, ph);
      b.restore();
      b.fillStyle = 'rgba(0,0,0,.18)';
      b.fillRect(0, 0, W, H);
    } else if (f.img) {
      const s = Math.max(W / f.img.width, H / f.img.height);
      const w = f.img.width * s, h = f.img.height * s;
      b.drawImage(f.img, (W - w) / 2, (H - h) / 2, w, h);
      b.fillStyle = 'rgba(0,0,0,.35)';
      b.fillRect(0, 0, W, H);
    } else {
      const gr = b.createLinearGradient(0, 0, W, H);
      gr.addColorStop(0, p.tint[0]);
      gr.addColorStop(1, p.tint[1]);
      b.fillStyle = gr;
      b.fillRect(0, 0, W, H);
    }
    const g = f.fg.getContext('2d');
    g.clearRect(0, 0, W, H);
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
    g.fillText(pad2(p._i + 1), 28, 42);
    g.textAlign = 'right';
    if (p.length) g.fillText(p.length, W - 28, 42);
    g.textAlign = 'left';
    const fit = fitTitle(g, p.title, W - 56);
    g.font = `800 ${fit.size}px "Akira Expanded", "Arial Black", sans-serif`;
    g.fillStyle = '#fff';
    const lh = fit.size * 0.98;
    const base = H - 74;
    fit.lines.forEach((ln, k) => g.fillText(ln, 26, base - (fit.lines.length - 1 - k) * lh));
    g.font = 'italic 400 27px "Apple Garamond", Garamond, serif';
    g.fillStyle = 'rgba(255,255,255,.78)';
    g.fillText(meta(p, ['client', 'kind', 'year']), 28, H - 34);
  }

  // Composite one frame of "footage": background, drifting light leak, grain, then text on top.
  let grainTick = 0;
  function draw(f, t) {
    if (!f.bg) bake(f);
    const { g, i } = f;
    const W = FW, H = FH, ph = f.play;
    g.drawImage(f.bg, 0, 0);
    if (!f.img) {
      const lx = W * (0.3 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 1.7)));
      const ly = H * (0.45 + 0.2 * Math.cos(t * 0.5 + i));
      const rg = g.createRadialGradient(lx, ly, 0, lx, ly, W * 0.55);
      rg.addColorStop(0, `rgba(255, 205, 185, ${0.08 + 0.2 * ph})`);
      rg.addColorStop(1, 'rgba(255, 205, 185, 0)');
      g.fillStyle = rg;
      g.fillRect(0, 0, W, H);
    }
    g.globalAlpha = 0.55 + 0.45 * ph;
    g.drawImage(grains[ph > 0.02 ? (grainTick++ % 3) : 0], 0, 0);
    g.globalAlpha = 1;
    g.drawImage(f.fg, 0, 0);
    if (ph > 0.01) {
      const prog = (t * 0.07 + i * 0.137) % 1;
      g.fillStyle = `rgba(255,255,255,${0.18 * ph})`;
      g.fillRect(28, H - 16, W - 56, 2);
      g.fillStyle = `rgba(179,18,46,${ph})`;
      g.fillRect(28, H - 16, (W - 56) * prog, 2);
    }
    f.lastDraw = t;
    f.tex.needsUpdate = true;
  }

  frames.forEach(f => draw(f, 0));
  if (document.fonts && document.fonts.load) {
    Promise.all([
      '800 40px "Akira Expanded"', 'italic 400 24px "Apple Garamond"', '500 17px Poppins', '600 15px Poppins'
    ].map(s => document.fonts.load(s))).then(() => {
      frames.forEach(f => { bake(f); draw(f, 0); });
      const nt = makeBandTexture();
      band.material.map = nt; band.material.needsUpdate = true; bandTex.dispose();
    }).catch(() => {});
  }

  /* ───────── Sizing ───────── */
  let W = 0, H = 0, radiusPx = 400;
  function resize() {
    W = hero.clientWidth; H = hero.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const half = Math.tan((camera.fov * Math.PI) / 360);
    const want = R * (camera.aspect < 1 ? 0.5 : 1.02);
    const dist = Math.max(8.6, want / (half * camera.aspect) + R);
    camera.position.set(0, 0.7, dist);
    camera.lookAt(0, -0.05, 0);
    camera.updateProjectionMatrix();
    scene.fog.near = dist - R * 0.3;
    scene.fog.far = dist + R * 1.7;
    // How many screen pixels the reel's radius covers, so a drag moves the film about as far as your finger.
    tilt.updateMatrixWorld(true);
    const c0 = new THREE.Vector3(0, 0, 0).applyMatrix4(tilt.matrixWorld).project(camera);
    const c1 = new THREE.Vector3(R, 0, 0).applyMatrix4(tilt.matrixWorld).project(camera);
    radiusPx = Math.max(120, Math.abs(c1.x - c0.x) * W / 2 / tilt.scale.x);
  }
  resize();
  addEventListener('resize', resize);

  /* ───────── Interaction ───────── */
  let angle = 0, target = 0, vel = 0;
  let wheeling = false, wheelTimer = 0;
  let dragging = false, engaged = false, isTouch = false, startX = 0, lastX = 0, moved = 0, lastMoveT = 0, pressed = -1;
  const MAX_VEL = 0.055;    // caps how far a flick can throw the reel (about two frames), per 60fps frame
  const DRAG_GAIN = 1.1;    // 1 = film moves exactly with the finger; higher turns a little further
  let dragAngle = 0, carry = 0; // pointer events arrive unevenly, so the reel eases toward dragAngle each frame
  const TOUCH_SLOP = 10;    // px a finger must move sideways before the reel starts turning
  let hovered = -1, pointerIn = false, lastInteract = performance.now();
  const mouse = new THREE.Vector2();
  const ray = new THREE.Raycaster();

  if (!reduce) { angle = target + 2.6; tilt.scale.setScalar(0.84); tilt.rotation.x = 0.55; }

  const hintPos = new THREE.Vector3();
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
    if (e.pointerType === 'mouse') dismissHint();   // on touch, wait to see if it's a drag/tap or a page scroll
    pressed = hovered;   // remember which frame was under the pointer when the press started
    dragging = true; moved = 0; vel = 0; carry = 0;
    dragAngle = angle;
    isTouch = e.pointerType !== 'mouse';
    engaged = !isTouch;
    startX = lastX = e.clientX; lastMoveT = performance.now();
    canvas.setPointerCapture(e.pointerId);
    lastInteract = performance.now();
  });
  canvas.addEventListener('pointermove', e => {
    pointerIn = true;
    const r = canvas.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    if (!dragging) return;
    if (!engaged) {
      // On touch, ignore small sideways wobble so scrolling the page doesn't turn the reel.
      moved = Math.abs(e.clientX - startX);
      if (moved < TOUCH_SLOP) return;
      engaged = true;
      dismissHint();
      lastX = e.clientX;
    }
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved += Math.abs(dx);
    const d = dx / radiusPx * DRAG_GAIN;
    dragAngle += d;
    const now = performance.now();
    const per60 = d / (Math.max(4, now - lastMoveT) / 16.667); // speed as if sampled at 60fps
    vel = Math.max(-MAX_VEL, Math.min(MAX_VEL, vel * 0.5 + per60 * 0.5));
    lastMoveT = now;
    lastInteract = now;
  });
  const endDrag = e => {
    if (!dragging) return;
    dragging = false;
    carry = dragAngle - angle;   // finish the bit of drag the eased reel hadn't caught up to yet
    // pointercancel means the browser took over (usually a vertical page scroll): stop where we are.
    if (e.type === 'pointercancel' || performance.now() - lastMoveT > 90) vel = 0;
    if (moved < 6 && e.type === 'pointerup' && pressed >= 0) { dismissHint(); vel = 0; goTo(pressed, true); return; }
    if (Math.abs(vel) < 0.002) { vel = 0; target = snap(angle + carry); }
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('pointerleave', () => { pointerIn = false; });
  // Two-finger sideways swipe on a trackpad (or shift + mouse wheel) spins the reel like a drag.
  // Mostly-vertical gestures are left alone so the page still scrolls normally.
  canvas.addEventListener('wheel', e => {
    let dx = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    if (!dx || (!e.shiftKey && Math.abs(e.deltaX) <= Math.abs(e.deltaY))) return;
    e.preventDefault();                       // also stops the browser's swipe-to-go-back
    if (e.deltaMode === 1) dx *= 16; else if (e.deltaMode === 2) dx *= innerWidth;
    dismissHint();
    if (!wheeling) { wheeling = true; dragAngle = angle; vel = 0; carry = 0; }
    dragAngle -= dx / radiusPx * DRAG_GAIN;
    lastInteract = performance.now();
    clearTimeout(wheelTimer);
    // the OS keeps sending momentum events after the fingers lift, so wait for them to stop, then settle on a frame
    wheelTimer = setTimeout(() => {
      wheeling = false;
      carry = dragAngle - angle;
      target = snap(angle + carry);
    }, 140);
  }, { passive: false });
  canvas.addEventListener('keydown', e => {
    if (e.key.startsWith('Arrow') || e.key === 'Enter' || e.key === ' ') dismissHint();
    if (e.key === 'ArrowRight') { e.preventDefault(); vel = 0; target = snap(target) - STEP; lastInteract = performance.now(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); vel = 0; target = snap(target) + STEP; lastInteract = performance.now(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProject(frontIndex()); }
  });

  /* ───────── Loop ───────── */
  const lerp = (a, b, k) => a + (b - a) * k;
  const glowBoost = hero.querySelector('.hero-glow-boost');
  let running = true, raf = 0, prevRot = angle, boost = 0, lastBoost = -1, lastT = 0, blurSm = 0;

  function frame(nowMs) {
    raf = requestAnimationFrame(frame);
    const t = nowMs / 1000;
    // Time-based easing so motion feels the same on 60Hz and 120Hz screens.
    const dt = lastT ? Math.min(0.05, (nowMs - lastT) / 1000) : 1 / 60;
    lastT = nowMs;
    const f60 = dt * 60;
    const ease = k => (reduce ? 1 : 1 - Math.pow(1 - k, f60));

    // spin: drag → inertia → settle on a frame
    if (dragging || wheeling) {
      angle = lerp(angle, dragAngle, ease(0.38));
    } else {
      if (carry) { const c = carry * ease(0.38); angle += c; carry = Math.abs(carry - c) < 1e-5 ? 0 : carry - c; }
      if (Math.abs(vel) > 0.0015) {
        angle += vel * f60;
        vel *= Math.pow(0.92, f60);
        if (Math.abs(vel) <= 0.0015) { vel = 0; target = snap(angle + carry); }
      } else if (!carry) {
        angle = lerp(angle, target, ease(0.075));
      }
    }
    // autoplay: advance one frame every few seconds when nobody is touching it
    if (!reduce && !dragging && !wheeling && !lbOpen && hovered < 0 && vel === 0 &&
        Math.abs(target - angle) < 0.003 && nowMs - lastInteract > 4200) {
      target -= STEP;
      lastInteract = nowMs;
    }
    // "spin me" hint: pops up from inside the ring and the reel gives a little wiggle
    if ((hintState === 'waiting' || hintState === 'resting') && nowMs >= hintNextAt && !lbOpen) showHint(nowMs);
    else if (hintState === 'shown' && nowMs >= hintNextAt) restHint(nowMs);
    const wt = nowMs - wiggleStart;
    const nudge = wiggleStart && !reduce && wt < 1800 ? Math.sin(wt / 1000 * 10) * 0.075 * Math.exp(-wt / 520) : 0;
    spin.rotation.y = angle + nudge;
    if (hintState === 'shown' || nowMs - hintGoneAt < 900) {
      tilt.updateMatrixWorld(true);
      hintPos.set(0, 0.28, 0);
      spin.localToWorld(hintPos);
      hintPos.project(camera);
      hint.style.transform = `translate3d(${((hintPos.x + 1) / 2 * W).toFixed(1)}px, ${((1 - hintPos.y) / 2 * H).toFixed(1)}px, 0)`;
    }

    // intro settle
    tilt.scale.setScalar(lerp(tilt.scale.x, 1, ease(0.045)));
    tilt.rotation.x = lerp(tilt.rotation.x, TILT.x, ease(0.045));

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
    const settled = Math.abs(target - angle) < 0.02 && !dragging && !wheeling && vel === 0;

    for (const f of frames) {
      const isHover = f.i === hovered;
      f.pop = lerp(f.pop, isHover ? 1 : 0, ease(0.12));
      f.lift.position.z = f.pop * 0.2;
      f.lift.scale.setScalar(1 + f.pop * 0.035);
      f.dim = lerp(f.dim, hovered >= 0 && !isHover ? 0.5 : 1, ease(0.1));
      f.front.material.color.setScalar(f.dim);
      const wantPlay = isHover || (hovered < 0 && settled && f.i === fi) ? 1 : 0;
      f.play = lerp(f.play, wantPlay, ease(0.08));
      // the "footage" on a frame updates at 24fps, like film, while the reel itself moves at full frame rate
      if (f.play > 0.01 && t - f.lastDraw >= 1 / 24) draw(f, t);
      else if (f.play <= 0.01 && f.play > 0.0005) { f.play = 0; draw(f, t); }
    }

    // angular speed of what's on screen (rad/s), including the hint wiggle
    const rot = spin.rotation.y;
    const omega = Math.abs(rot - prevRot) / dt;
    prevRot = rot;

    // motion blur like a film camera's 180° shutter at 24fps (1/48s of motion); slow drifts stay sharp
    blurSm = lerp(blurSm, reduce ? 0 : Math.min(0.14, Math.max(0, omega - 0.35) / 48), ease(0.35));
    blurFrame.value = blurSm / ARC;
    blurBand.value = blurSm / (Math.PI * 2) * N;

    // glow reacts to spin speed and hover (opacity only, so the browser never repaints the blur)
    boost = lerp(boost, Math.min(1, omega * 0.35 + (hovered >= 0 ? 0.35 : 0)), ease(0.08));
    if (glowBoost && Math.abs(boost - lastBoost) > 0.01) { glowBoost.style.opacity = boost.toFixed(3); lastBoost = boost; }

    renderer.render(scene, camera);
  }

  function setRunning(on) {
    if (on === running) return;
    running = on;
    lastT = 0;
    if (on) raf = requestAnimationFrame(frame);
    else cancelAnimationFrame(raf);
  }
  // The reel pauses while offscreen, while the tab is hidden, and while a project is open on top of it.
  var syncRunning = () => setRunning(onScreen && !document.hidden && !lbOpen);
  raf = requestAnimationFrame(frame);
  let onScreen = true;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; syncRunning(); }).observe(hero);

  // As the hero scrolls out of view, report how far (0..1) so CSS can drift and fade its contents.
  let outRaf = 0;
  function onScroll() {
    outRaf = 0;
    const h = hero.offsetHeight || innerHeight;
    const p = Math.min(1, Math.max(0, -hero.getBoundingClientRect().top / h));
    hero.style.setProperty('--out', p.toFixed(3));
    if (p > 0.04) dismissHint();   // once they've scrolled on, the hint has done its job
  }
  addEventListener('scroll', () => { if (!outRaf) outRaf = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();
  document.addEventListener('visibilitychange', syncRunning);
})();
