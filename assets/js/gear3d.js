// Gear: real-time 3D models of the Lumix S5, Lumix S9, Blackmagic Pocket 6K Pro and DJI Mavic 3 Pro.
// Built from primitives in Three.js (no model files to download). Drag to spin, tap hotspots,
// recolour the S9, record on the cameras, and take off with the Mavic.
(() => {
  const wrap = document.getElementById('g3d');
  const G = window.GEAR;
  if (!wrap || !G) return;
  const canvas = document.getElementById('g3d-canvas');
  const spotsEl = document.getElementById('g3d-spots');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = window.THREE;
  const $ = id => document.getElementById(id);
  const pad2 = n => String(n).padStart(2, '0');

  /* ───────── Detail panel + tabs + kit list (work even without WebGL) ───────── */
  const panel = { body: $('gd-body'), name: $('gd-name'), line: $('gd-model'), note: $('gd-note'), part: $('gd-part'), specs: $('gd-specs'), idx: $('gd-index'), total: $('gd-total') };
  const tabs = G.devices.map(d => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.dataset.cursor = 'link';
    b.setAttribute('role', 'tab'); b.textContent = d.tab;
    b.addEventListener('click', () => show(d.id));
    $('gear-tabs').append(b);
    return b;
  });
  G.kit.forEach(group => {
    const col = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = group.group;
    const ul = document.createElement('ul');
    group.items.forEach(([label, id]) => {
      const li = document.createElement('li');
      if (id) {
        const b = document.createElement('button');
        b.type = 'button'; b.textContent = label; b.dataset.cursor = 'link';
        b.addEventListener('click', () => { show(id); wrap.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
        li.append(b);
      } else li.textContent = label;
      ul.append(li);
    });
    col.append(h, ul);
    $('kit').append(col);
  });

  let current = null;
  function fillPanel(d, animate) {
    const i = G.devices.indexOf(d);
    panel.idx.textContent = pad2(i + 1);
    panel.total.textContent = pad2(G.devices.length);
    const fill = () => {
      panel.name.textContent = d.name;
      panel.line.textContent = d.line;
      panel.note.textContent = d.note;
      panel.part.textContent = '';
      panel.part.hidden = true;
      panel.specs.replaceChildren(...d.specs.map(([k, v]) => {
        const row = document.createElement('div');
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = v;
        row.append(dt, dd);
        return row;
      }));
    };
    if (animate && !reduce && panel.body.animate) {
      panel.body.animate([{ opacity: 1 }, { opacity: 0, transform: 'translateY(-8px)' }], { duration: 160, easing: 'ease-in' }).finished.then(() => {
        fill();
        panel.body.animate([{ opacity: 0, transform: 'translateY(12px)', filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
      });
    } else fill();
  }
  function showPart(h) {
    panel.part.hidden = false;
    panel.part.replaceChildren();
    const b = document.createElement('b'); b.textContent = h.label;
    panel.part.append(b, document.createTextNode(' ' + h.text));
    if (!reduce && panel.part.animate) panel.part.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  $('gd-prev').addEventListener('click', () => step(-1));
  $('gd-next').addEventListener('click', () => step(1));
  function step(k) {
    const i = G.devices.findIndex(d => d.id === current);
    show(G.devices[(i + k + G.devices.length) % G.devices.length].id);
  }

  /* ───────── WebGL ───────── */
  let renderer = null;
  try {
    if (!T) throw new Error('no three');
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    wrap.classList.add('no-webgl');
  }
  if (!renderer) {
    // Without 3D, the tabs still switch the panel.
    show(G.devices[0].id);
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(26, 1, 0.1, 60);

  // Studio environment: a grey room with softboxes, pre-blurred for reflections.
  {
    const env = new T.Scene();
    const room = new T.Mesh(new T.BoxGeometry(12, 8, 12), new T.MeshBasicMaterial({ color: 0x0c0c0d, side: T.BackSide }));
    env.add(room);
    const box = (w, h, x, y, z, ry, rx, c) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide }));
      m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); env.add(m);
    };
    box(5, 2.2, 0, 3.9, 0.5, 0, Math.PI / 2, new T.Color(3.2, 3.2, 3.2)); // overhead
    box(1.2, 4.5, -5.9, 0.6, 1, Math.PI / 2, 0, new T.Color(2.6, 2.6, 2.6)); // left strip
    box(0.9, 4.5, 5.9, 0.6, -1, -Math.PI / 2, 0, new T.Color(1.6, 1.6, 1.6)); // right strip
    box(3, 0.8, 1.5, -2.2, 5.9, Math.PI, 0, new T.Color(0.45, 0.45, 0.45)); // low front fill
    box(2.4, 2.4, 2, 1, -5.9, 0, 0, new T.Color(0.7, 0.7, 0.75));        // soft back kicker for edge separation
    const pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.035).texture;
    pm.dispose();
  }
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  const key = new T.DirectionalLight(0xffffff, 0.75);
  key.position.set(2.5, 6, 3.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  Object.assign(key.shadow.camera, { left: -2.5, right: 2.5, top: 2.5, bottom: -2.5, near: 1, far: 14 });
  scene.add(key, new T.AmbientLight(0xffffff, 0.08));
  const catcher = new T.Mesh(new T.PlaneGeometry(8, 8), new T.ShadowMaterial({ opacity: 0.18 }));
  catcher.rotation.x = -Math.PI / 2; catcher.receiveShadow = true;
  scene.add(catcher);

  /* ───────── Textures ───────── */
  const canvasTex = (w, h, draw, repeat) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };
  const noise = (g, w, h, amp) => {
    const d = g.createImageData(w, h);
    for (let k = 0; k < d.data.length; k += 4) { const v = 128 + (Math.random() - 0.5) * amp; d.data[k] = d.data[k + 1] = d.data[k + 2] = v; d.data[k + 3] = 255; }
    g.putImageData(d, 0, 0);
  };
  const fine = canvasTex(256, 256, (g, w, h) => noise(g, w, h, 70), [7, 7]);
  const leather = canvasTex(256, 256, (g, w, h) => {
    noise(g, w, h, 30);
    for (let k = 0; k < 900; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.35})`; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 1 + Math.random() * 3, 0, 7); g.fill(); }
  }, [5, 5]);
  const ridges = canvasTex(512, 8, (g, w, h) => {
    g.fillStyle = '#888'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 8) { g.fillStyle = '#222'; g.fillRect(x, 0, 3, h); }
  }, [1, 1]);
  const knurl = canvasTex(256, 8, (g, w, h) => {
    g.fillStyle = '#999'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 4) { g.fillStyle = '#333'; g.fillRect(x, 0, 2, h); }
  }, [1, 1]);
  const textTex = (text, font, color = '#fff', w = 512, h = 128) => {
    const t = canvasTex(w, h, (g) => { g.clearRect(0, 0, w, h); g.fillStyle = color; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 4); });
    t.wrapS = t.wrapT = T.ClampToEdgeWrapping;
    t.encoding = T.sRGBEncoding;
    return t;
  };

  /* ───────── Materials ───────── */
  const M = {
    body: c => new T.MeshPhysicalMaterial({ color: c, roughness: 0.55, metalness: 0.05, clearcoat: 0.12, clearcoatRoughness: 0.5, bumpMap: fine, bumpScale: 0.0018 }),
    rubber: new T.MeshStandardMaterial({ color: 0x141415, roughness: 0.9, metalness: 0, bumpMap: leather, bumpScale: 0.006 }),
    ring: new T.MeshStandardMaterial({ color: 0x141415, roughness: 0.85, bumpMap: ridges, bumpScale: 0.01 }),
    barrel: new T.MeshPhysicalMaterial({ color: 0x18181a, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    metal: new T.MeshStandardMaterial({ color: 0xc4c6c9, roughness: 0.25, metalness: 1 }),
    darkMetal: new T.MeshStandardMaterial({ color: 0x3a3b3e, roughness: 0.32, metalness: 0.9 }),
    knurled: new T.MeshStandardMaterial({ color: 0x232325, roughness: 0.5, metalness: 0.6, bumpMap: knurl, bumpScale: 0.01 }),
    glass: new T.MeshPhysicalMaterial({ color: 0x06080c, roughness: 0.03, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0, iridescence: 1, iridescenceIOR: 1.7, iridescenceThicknessRange: [180, 620], envMapIntensity: 1.4 }),
    screen: new T.MeshPhysicalMaterial({ color: 0x08090b, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6 }),
    red: () => new T.MeshStandardMaterial({ color: 0xb3122e, roughness: 0.35, emissive: 0x000000 }),
    tally: () => new T.MeshStandardMaterial({ color: 0x3a0a12, roughness: 0.2, emissive: 0x000000 }),
    decal: (tex, opacity = 1) => new T.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: false }),
  };

  /* ───────── Geometry helpers ───────── */
  function rrect(w, h, r) {
    const s = new T.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  // Box with rounded edges and corners: width (x), height (y), depth (z), edge radius.
  function rbox(w, h, d, r) {
    r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3);
    const iw = w - 2 * r, ih = h - 2 * r;
    const g = new T.ExtrudeGeometry(rrect(iw, ih, Math.min(r * 0.6, iw / 2, ih / 2)), {
      depth: Math.max(1e-4, d - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 4, curveSegments: 6,
    });
    g.center();
    return g;
  }
  const cylZ = (r1, r2, len, seg = 64) => new T.CylinderGeometry(r1, r2, len, seg, 1).rotateX(Math.PI / 2);
  const cylY = (r, h, seg = 48) => new T.CylinderGeometry(r, r, h, seg, 1);
  const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); return m; };
  const decal = (tex, w, h, x, y, z, ry = 0, rx = 0, opacity = 1) => {
    const m = mesh(new T.PlaneGeometry(w, h), M.decal(tex, opacity), x, y, z);
    m.rotation.set(rx, ry, 0);
    return m;
  };
  // A lens built from rings along +z, starting at z0. parts: [radius, length, material]
  function lens(g, x, y, z0, parts, glassR) {
    let z = z0;
    parts.forEach(([r, len, mat]) => { g.add(mesh(cylZ(r, r, len), mat, x, y, z + len / 2)); z += len; });
    const lip = mesh(new T.TorusGeometry(glassR + 0.025, 0.022, 12, 64), M.barrel, x, y, z);
    g.add(lip);
    g.add(mesh(cylZ(glassR, glassR, 0.012), M.glass, x, y, z - 0.012));
    g.add(mesh(cylZ(glassR * 0.55, glassR * 0.55, 0.01), M.glass, x, y, z - 0.03));
    return z;
  }
  const A = (p, n) => ({ p: new T.Vector3(...p), n: new T.Vector3(...n).normalize() });

  /* ───────── Models ───────── */
  /* ───────── Detail helpers (used by the hi-detail S5) ───────── */
  // Pebbled leatherette: a height map of tiny bumps, used as bump + roughness variation.
  const pebble = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, w, h);
    for (let k = 0; k < 5200; k++) {
      const x = Math.random() * w, y = Math.random() * h, r = 2 + Math.random() * 4.5;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(0,0,0,.25)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
  }, [3, 3]);
  const satin = canvasTex(256, 256, (g, w, h) => noise(g, w, h, 40), [4, 4]);
  const S5MAT = {
    paint: new T.MeshPhysicalMaterial({ color: 0x1b1b1d, roughness: 0.46, roughnessMap: satin, metalness: 0.15, clearcoat: 0.28, clearcoatRoughness: 0.38, bumpMap: fine, bumpScale: 0.0012 }),
    leather: new T.MeshStandardMaterial({ color: 0x151516, roughness: 0.82, roughnessMap: pebble, bumpMap: pebble, bumpScale: 0.0065 }),
    rubber: new T.MeshStandardMaterial({ color: 0x111112, roughness: 0.95, bumpMap: leather, bumpScale: 0.003 }),
    chrome: new T.MeshStandardMaterial({ color: 0xd9dbde, roughness: 0.16, metalness: 1 }),
    satinMetal: new T.MeshStandardMaterial({ color: 0x8d9095, roughness: 0.32, metalness: 1, bumpMap: fine, bumpScale: 0.001 }),
    button: new T.MeshPhysicalMaterial({ color: 0x1e1e20, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    eyeGlass: new T.MeshPhysicalMaterial({ color: 0x050608, roughness: 0.05, clearcoat: 1, envMapIntensity: 1.2 }),
  };
  // A band of printed text wrapped around a lens or dial (transparent canvas on an open cylinder).
  function printBand(r, len, text, opt = {}) {
    const W = 2048, H = 128;
    const tex = canvasTex(W, H, g => {
      g.clearRect(0, 0, W, H);
      g.fillStyle = opt.color || '#f1f1f1';
      g.font = opt.font || '500 54px Poppins, sans-serif';
      g.textBaseline = 'middle';
      const items = Array.isArray(text) ? text : [text];
      items.forEach(([t, u]) => { g.textAlign = 'center'; g.fillText(t, u * W, H / 2 + 3); });
    });
    tex.wrapS = T.ClampToEdgeWrapping; tex.encoding = T.sRGBEncoding;
    const geo = new T.CylinderGeometry(r, r, len, 96, 1, true);
    if (opt.axisZ !== false) geo.rotateX(-Math.PI / 2); // text reads upright from the front of the camera
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, opacity: opt.opacity || 1 }));
    return m;
  }
  // Ribbed rubber ring around +z (zoom/focus ring) using real geometry ridges, not just a texture.
  function ribbedRing(r, len, ribs, depth, mat) {
    const pts = [];
    const steps = ribs * 2;
    for (let k = 0; k <= steps; k++) {
      const a = (k / steps) * Math.PI * 2;
      const rr = r - (k % 2 ? depth : 0);
      pts.push(new T.Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
    }
    const shape = new T.Shape(pts);
    const g = new T.ExtrudeGeometry(shape, { depth: len, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.004, bevelSegments: 2, curveSegments: 1 });
    g.translate(0, 0, -len / 2);
    return new T.Mesh(g, mat);
  }
  // Extruded shape from a 2D outline, with rounded edges, centred on its depth.
  function extrudeRounded(shape, depth, r, segs = 4) {
    const g = new T.ExtrudeGeometry(shape, { depth: Math.max(1e-4, depth - 2 * r), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: segs, curveSegments: 14 });
    g.translate(0, 0, -(depth - 2 * r) / 2);
    return g;
  }

  // Lumix S5: modelled on the real camera's layout (132.6 × 97.1 × 81.9 mm; 1 unit = 100 mm).
  function buildS5() {
    const g = new T.Group(), P = S5MAT;
    const add = (m, cast = true) => { m.castShadow = cast; m.receiveShadow = true; g.add(m); return m; };

    // Main body shell with the textured front plate inset
    add(mesh(rbox(1.3, 0.78, 0.4, 0.055), P.paint));
    add(mesh(rbox(1.06, 0.58, 0.014, 0.006), P.leather, 0.1, -0.08, 0.204));

    // Grip: a sculpted D-shape in plan, extruded up the side, leatherette, with a painted top cap
    const gs = new T.Shape();
    gs.moveTo(-0.665, -0.16); gs.lineTo(-0.665, 0.3);
    gs.bezierCurveTo(-0.665, 0.41, -0.58, 0.44, -0.48, 0.42);
    gs.bezierCurveTo(-0.37, 0.4, -0.31, 0.33, -0.3, 0.22);
    gs.lineTo(-0.3, -0.16); gs.closePath();
    const gripGeo = extrudeRounded(gs, 0.68, 0.035); gripGeo.rotateX(Math.PI / 2);
    const grip = add(mesh(gripGeo, P.leather, 0, -0.05, 0)); grip.scale.set(1, 1, 1);
    const capGeo = extrudeRounded(gs, 0.1, 0.03); capGeo.rotateX(Math.PI / 2);
    add(mesh(capGeo, P.paint, 0, 0.345, 0));

    // Viewfinder housing: trapezoid in front view, front face slanted back, shoulders bevelled
    const ps = new T.Shape();
    ps.moveTo(-0.3, 0); ps.lineTo(0.3, 0); ps.lineTo(0.2, 0.25); ps.lineTo(-0.2, 0.25); ps.closePath();
    const prism = extrudeRounded(ps, 0.38, 0.035, 5);
    const pos = prism.attributes.position;
    for (let k = 0; k < pos.count; k++) { const y = pos.getY(k), z = pos.getZ(k); if (z > 0) pos.setZ(k, z - Math.max(0, y) * 0.5); }
    prism.computeVertexNormals();
    add(mesh(prism, P.paint, 0.08, 0.37, -0.02));
    add(mesh(rbox(0.21, 0.025, 0.17, 0.006), P.satinMetal, 0.08, 0.635, -0.05));          // hot shoe
    add(mesh(rbox(0.17, 0.008, 0.13, 0.003), P.button, 0.08, 0.648, -0.05));
    const brand = decal(textTex('LUMIX', '600 92px Poppins, sans-serif', '#f4f4f4'), 0.28, 0.07, 0.08, 0.5, 0.118, 0, -Math.atan(0.5));
    g.add(brand);

    // L-Mount: black throat, chrome bayonet, lens release button
    add(mesh(cylZ(0.35, 0.35, 0.02), P.paint, 0.1, -0.04, 0.212));
    add(mesh(cylZ(0.31, 0.31, 0.022), P.chrome, 0.1, -0.04, 0.232));
    add(mesh(cylZ(0.035, 0.035, 0.02), P.button, 0.5, -0.2, 0.212));
    [[-0.17, -0.18], [-0.17, -0.29]].forEach(([x, y]) => add(mesh(cylZ(0.024, 0.024, 0.016), P.button, x, y, 0.212)));   // Fn buttons by the grip

    // Lumix S 20–60mm f/3.5–5.6
    const lx = 0.1, ly = -0.04;
    let z = 0.243;
    const seg = (r1, r2, len, mat) => { add(mesh(cylZ(r2, r1, len), mat, lx, ly, z + len / 2)); z += len; };
    seg(0.3, 0.305, 0.045, P.paint);
    const zoomZ0 = z; seg(0.31, 0.31, 0.03, P.paint);
    const zoom = ribbedRing(0.327, 0.21, 90, 0.01, P.rubber); zoom.position.set(lx, ly, z + 0.105); add(zoom); z += 0.21;
    seg(0.315, 0.315, 0.035, P.paint);
    const midZ = z - 0.018;
    const focus = ribbedRing(0.318, 0.075, 140, 0.006, P.rubber); focus.position.set(lx, ly, z + 0.04); add(focus); z += 0.08;
    seg(0.322, 0.335, 0.11, P.paint);
    const frontZ = z;
    add(mesh(new T.TorusGeometry(0.31, 0.014, 14, 96), P.paint, lx, ly, frontZ));
    add(mesh(cylZ(0.29, 0.29, 0.02), P.satinMetal, lx, ly, frontZ - 0.012));             // filter thread
    add(mesh(cylZ(0.27, 0.27, 0.04), P.paint, lx, ly, frontZ - 0.05));                          // inner black baffle
    const dome = mesh(new T.SphereGeometry(0.27, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, lx, ly, frontZ - 0.045);
    dome.rotation.x = Math.PI / 2; dome.scale.set(1, 0.22, 1); g.add(dome);                         // convex front element
    const inner = mesh(new T.SphereGeometry(0.15, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.glass, lx, ly, frontZ - 0.07);
    inner.rotation.x = Math.PI / 2; inner.scale.set(1, 0.3, 1); g.add(inner);
    const scale = printBand(0.312, 0.03, [['20', 0.44], ['24', 0.47], ['28', 0.5], ['35', 0.53], ['50', 0.56], ['60', 0.59]], { font: '600 88px Poppins, sans-serif' });
    scale.position.set(lx, ly, zoomZ0 + 0.015); scale.rotation.z = Math.PI; g.add(scale);
    const lensName = printBand(0.317, 0.034, [['LUMIX S', 0.4], ['1:3.5-5.6/20-60', 0.56]], { font: '500 84px Poppins, sans-serif' });
    lensName.position.set(lx, ly, midZ); lensName.rotation.z = Math.PI; g.add(lensName);
    const frontText = printBand(0.337, 0.03, [['LUMIX S  20-60  ASPH.', 0.5]], { font: '500 76px Poppins, sans-serif', opacity: 0.85 });
    frontText.position.set(lx, ly, frontZ - 0.035); frontText.rotation.z = Math.PI; g.add(frontText);

    // Top plate: mode dial with markings (camera's left shoulder = +x), grip controls on the right
    add(mesh(cylY(0.115, 0.012), P.paint, 0.46, 0.396, -0.03));
    add(mesh(cylY(0.105, 0.06), M.knurled, 0.46, 0.43, -0.03));
    const marks = printBand(0.1065, 0.03, ['iA', 'P', 'A', 'S', 'M', 'C1', 'C2', 'C3', 'S&Q'].map((t, k) => [t, (k + 0.5) / 9]), { axisZ: false, font: '600 60px Poppins, sans-serif' });
    marks.position.set(0.46, 0.43, -0.03); g.add(marks);
    add(mesh(cylY(0.045, 0.02), P.button, 0.46, 0.468, -0.03));
    const shutterBase = add(mesh(cylY(0.05, 0.02), P.paint, -0.46, 0.405, 0.3)); shutterBase.rotation.x = 0.25;
    const shutter = add(mesh(new T.SphereGeometry(0.038, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), P.satinMetal, -0.46, 0.415, 0.3)); shutter.scale.y = 0.45;
    const fdial = add(mesh(cylY(0.07, 0.035), M.knurled, -0.4, 0.4, 0.38)); fdial.rotation.x = 0.35;     // front dial
    const rec = add(mesh(cylY(0.026, 0.016), M.red(), -0.33, 0.402, 0.18));                               // video record
    [-0.27, -0.2, -0.13].forEach(x => add(mesh(rbox(0.05, 0.016, 0.04, 0.008), P.button, x, 0.398, 0.08))); // WB / ISO / ±
    add(mesh(cylY(0.068, 0.034), M.knurled, -0.47, 0.405, -0.12));                                        // rear dial

    // Back: free-angle screen (hinged on the camera's left), eyecup, joystick, wheel and buttons
    add(mesh(rbox(0.84, 0.56, 0.045, 0.03), P.paint, 0.08, -0.07, -0.226));
    const scr = mesh(new T.PlaneGeometry(0.74, 0.47), M.screen, 0.08, -0.07, -0.2495); scr.rotation.y = Math.PI; g.add(scr);
    add(mesh(cylY(0.022, 0.42), P.paint, 0.505, -0.07, -0.226));
    add(mesh(rbox(0.32, 0.21, 0.09, 0.05), P.rubber, 0.08, 0.53, -0.235));
    const eye = mesh(new T.PlaneGeometry(0.18, 0.11), P.eyeGlass, 0.08, 0.53, -0.281); eye.rotation.y = Math.PI; g.add(eye);
    add(mesh(rbox(0.2, 0.16, 0.02, 0.01), P.leather, -0.5, 0.2, -0.206));                                 // thumb rest
    add(mesh(cylZ(0.03, 0.03, 0.02), P.button, -0.36, 0.06, -0.21));                                       // joystick
    add(mesh(new T.SphereGeometry(0.02, 16, 12), P.button, -0.36, 0.06, -0.224));
    const wheel = add(mesh(new T.TorusGeometry(0.075, 0.016, 12, 48), M.knurled, -0.4, -0.16, -0.214));
    add(mesh(cylZ(0.04, 0.04, 0.012), P.button, -0.4, -0.16, -0.21));
    [[-0.27, 0.2], [-0.56, -0.03], [-0.56, -0.3], [-0.27, -0.31], [-0.2, 0.06]].forEach(([x, y]) => add(mesh(cylZ(0.022, 0.022, 0.014), P.button, x, y, -0.207)));

    // Sides: port doors (camera's left), card door (grip side), strap lugs
    add(mesh(rbox(0.014, 0.3, 0.24, 0.006), P.rubber, 0.652, -0.02, -0.02));
    add(mesh(rbox(0.014, 0.34, 0.24, 0.006), P.paint, -0.662, -0.06, 0.05));
    [0.656, -0.668].forEach(x => { const lug = add(mesh(new T.TorusGeometry(0.032, 0.009, 8, 20), P.satinMetal, x, 0.29, -0.04)); lug.rotation.y = Math.PI / 2; });
    add(mesh(cylY(0.03, 0.006), P.satinMetal, 0.1, -0.392, -0.02));                                        // tripod socket

    // Front details: tally lamp, badge
    const tally = mesh(new T.SphereGeometry(0.02, 16, 12), M.tally(), -0.21, 0.29, 0.205); tally.scale.z = 0.4; g.add(tally);
    g.add(decal(textTex('S5', '600 80px Poppins, sans-serif', '#d6d7d9'), 0.11, 0.03, 0.55, -0.31, 0.2125));

    return {
      group: g, rec, tally,
      anchors: { lens: A([lx, ly, frontZ + 0.01], [0, 0, 1]), record: A([-0.33, 0.42, 0.18], [0, 1, 0.15]), screen: A([0.08, -0.07, -0.26], [0, 0, -1]), evf: A([0.08, 0.53, -0.29], [0, 0.25, -1]) },
    };
  }

  function buildS9() {
    const g = new T.Group(), body = M.body(0x1d1d1f);
    const skin = new T.MeshStandardMaterial({ color: 0x1d1d1f, roughness: 0.8, bumpMap: leather, bumpScale: 0.005 });
    g.add(mesh(rbox(1.26, 0.74, 0.3, 0.08), body));
    g.add(mesh(rbox(1.2, 0.56, 0.014, 0.006), skin, -0.0, -0.03, 0.152));
    g.add(mesh(rbox(0.16, 0.6, 0.07, 0.035), body, -0.52, -0.02, 0.17));                // grip ridge
    g.add(mesh(cylZ(0.3, 0.3, 0.035), M.metal, 0.14, -0.02, 0.165));
    const front = lens(g, 0.14, -0.02, 0.18, [[0.285, 0.05, M.barrel], [0.295, 0.08, M.ring], [0.29, 0.05, M.barrel]], 0.215);
    g.add(mesh(cylY(0.045, 0.025), M.metal, -0.46, 0.38, 0.05));
    const rec = mesh(cylY(0.03, 0.018), M.red(), -0.31, 0.375, 0.02); g.add(rec);
    const lut = mesh(cylY(0.034, 0.016), M.darkMetal, -0.18, 0.375, 0.02); g.add(lut);
    g.add(decal(textTex('LUT', '700 100px Poppins, sans-serif', '#d8d8d8', 256, 128), 0.06, 0.03, -0.18, 0.385, 0.06, 0, -Math.PI / 2));
    g.add(mesh(rbox(0.2, 0.02, 0.16, 0.005), M.metal, 0.14, 0.38, 0));
    g.add(mesh(rbox(0.84, 0.58, 0.04, 0.03), body, 0.1, 0, -0.17));
    const scr = mesh(new T.PlaneGeometry(0.76, 0.5), M.screen, 0.1, 0, -0.192); scr.rotation.y = Math.PI; g.add(scr);
    g.add(decal(textTex('LUMIX', '700 96px Poppins, sans-serif'), 0.26, 0.065, -0.3, 0.27, 0.161));
    const tally = mesh(cylZ(0.018, 0.018, 0.01), M.tally(), 0.5, 0.27, 0.152); g.add(tally);
    return {
      group: g, rec, tally, paint: [body, skin],
      anchors: { lens: A([0.14, -0.02, front + 0.02], [0, 0, 1]), lut: A([-0.18, 0.4, 0.02], [0, 1, 0.1]), record: A([-0.31, 0.4, 0.02], [0, 1, 0.1]), screen: A([0.1, 0, -0.2], [0, 0, -1]) },
    };
  }

  function buildBM6K() {
    const g = new T.Group(), body = M.body(0x27282b);
    g.add(mesh(rbox(1.62, 1.0, 0.62, 0.09), body));
    g.add(mesh(rbox(0.44, 1.0, 0.6, 0.16), M.rubber, -0.66, 0, 0.13));                 // big grip
    g.add(mesh(cylZ(0.37, 0.37, 0.05), M.metal, 0.2, -0.02, 0.335));                   // EF mount
    g.add(mesh(cylZ(0.4, 0.4, 0.02), M.darkMetal, 0.2, -0.02, 0.315));
    const front = lens(g, 0.2, -0.02, 0.36, [[0.36, 0.12, M.barrel], [0.39, 0.26, M.ring], [0.37, 0.14, M.barrel], [0.385, 0.18, M.ring], [0.4, 0.08, M.barrel]], 0.32);
    const rec = mesh(cylY(0.045, 0.025), M.red(), -0.62, 0.51, 0.2); g.add(rec);
    [0.15, 0.3, 0.45].forEach(x => g.add(mesh(rbox(0.11, 0.025, 0.07, 0.01), M.darkMetal, x, 0.51, -0.12)));   // ISO / shutter / WB
    g.add(mesh(rbox(0.11, 0.025, 0.07, 0.01), M.darkMetal, 0.6, 0.51, -0.12));          // ND
    g.add(decal(textTex('ND', '700 100px Poppins, sans-serif', '#d8d8d8', 256, 128), 0.06, 0.03, 0.6, 0.525, -0.05, 0, -Math.PI / 2));
    for (let k = 0; k < 12; k++) g.add(mesh(cylY(0.008, 0.01, 8), M.darkMetal, -0.1 + (k % 6) * 0.03, 0.505, 0.1 + Math.floor(k / 6) * 0.03)); // mic grille
    const hinge = new T.Group(); hinge.position.set(0.15, -0.02, -0.33); hinge.rotation.x = -0.18;
    hinge.add(mesh(rbox(1.26, 0.8, 0.06, 0.04), body, 0, 0, -0.03));
    const scr = mesh(new T.PlaneGeometry(1.14, 0.68), M.screen, 0, 0, -0.062); scr.rotation.y = Math.PI; hinge.add(scr);
    g.add(hinge);
    g.add(decal(textTex('Blackmagic', '500 90px Poppins, sans-serif', '#f2f2f2'), 0.36, 0.08, 0.62, 0.38, 0.312));
    g.add(decal(textTex('6K PRO', '700 90px Poppins, sans-serif', '#d0d0d0'), 0.22, 0.05, 0.45, 0.506, 0.15, 0, -Math.PI / 2));
    const tally = mesh(cylZ(0.022, 0.022, 0.01), M.tally(), 0.72, 0.28, 0.312); g.add(tally);
    return {
      group: g, rec, tally,
      anchors: { lens: A([0.2, -0.02, front + 0.02], [0, 0, 1]), nd: A([0.6, 0.53, -0.12], [0, 1, 0]), screen: A([0.15, -0.02, -0.43], [0, -0.15, -1]), record: A([-0.62, 0.54, 0.2], [0, 1, 0.1]) },
    };
  }

  function buildMavic() {
    const g = new T.Group(), body = M.body(0x46484b);
    const shell = new T.MeshPhysicalMaterial({ color: 0x505256, roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.3 });
    const craft = new T.Group(); g.add(craft);
    craft.add(mesh(rbox(0.44, 0.24, 0.95, 0.11), body));
    craft.add(mesh(rbox(0.36, 0.08, 0.66, 0.04), shell, 0, 0.13, -0.04));
    craft.add(mesh(rbox(0.3, 0.025, 0.36, 0.012), new T.MeshStandardMaterial({ color: 0x2c2d30, roughness: 0.5 }), 0, 0.17, -0.2)); // battery top
    craft.add(decal(textTex('DJI', '800 110px Poppins, sans-serif', '#e9e9e9', 256, 128), 0.12, 0.06, 0, 0.176, 0.12, 0, -Math.PI / 2));
    [-0.1, 0.1].forEach(x => { const s = mesh(new T.SphereGeometry(0.04, 24, 16), M.glass, x, 0.03, 0.46); s.scale.set(1, 0.6, 0.4); craft.add(s); }); // front sensors
    [-0.1, 0.1].forEach(x => { const s = mesh(new T.SphereGeometry(0.035, 24, 16), M.glass, x, 0.0, -0.47); s.scale.set(1, 0.6, 0.4); craft.add(s); });
    // gimbal + triple camera
    craft.add(mesh(rbox(0.07, 0.12, 0.07, 0.02), M.darkMetal, 0, -0.15, 0.4));
    craft.add(mesh(rbox(0.27, 0.16, 0.17, 0.04), M.body(0x2b2c2f), 0, -0.25, 0.46));
    const cam = (r, x, y) => { craft.add(mesh(cylZ(r + 0.01, r + 0.01, 0.025), M.barrel, x, y, 0.555)); craft.add(mesh(cylZ(r, r, 0.01), M.glass, x, y, 0.569)); };
    cam(0.052, -0.05, -0.25); cam(0.03, 0.07, -0.21); cam(0.026, 0.07, -0.29);
    craft.add(decal(textTex('HASSELBLAD', '600 64px Poppins, sans-serif', '#cfcfcf', 512, 96), 0.12, 0.022, -0.05, -0.315, 0.551));
    // arms, motors, props, legs
    const props = [];
    const armMat = M.body(0x3f4144);
    [[0.2, 0.03, 0.3, 0.64, 0.07, 0.6], [-0.2, 0.03, 0.3, -0.64, 0.07, 0.6], [0.2, -0.05, -0.32, 0.64, -0.09, -0.62], [-0.2, -0.05, -0.32, -0.64, -0.09, -0.62]].forEach(([x1, y1, z1, x2, y2, z2], k) => {
      const a = new T.Vector3(x1, y1, z1), b = new T.Vector3(x2, y2, z2);
      const len = a.distanceTo(b);
      const arm = mesh(rbox(0.07, 0.055, len, 0.025), armMat);
      arm.position.copy(a).add(b).multiplyScalar(0.5); arm.lookAt(b); craft.add(arm);
      craft.add(mesh(cylY(0.065, 0.08), M.darkMetal, x2, y2 + 0.04, z2));
      craft.add(mesh(cylY(0.012, 0.13, 10), M.darkMetal, x2, y2 - 0.08, z2));                 // leg
      const led = mesh(new T.SphereGeometry(0.014, 12, 8), new T.MeshBasicMaterial({ color: k < 2 ? 0xff3344 : 0x38ff7a }), x2, y2 - 0.01, z2 + (z2 > 0 ? 0.06 : -0.06));
      craft.add(led);
      const hub = new T.Group(); hub.position.set(x2, y2 + 0.1, z2);
      hub.add(mesh(cylY(0.03, 0.03), M.metal));
      [0, Math.PI].forEach(r => {
        const blade = mesh(rbox(0.42, 0.012, 0.06, 0.006), new T.MeshStandardMaterial({ color: 0x1a1a1b, roughness: 0.4 }), 0.22, 0, 0);
        blade.rotation.x = 0.12;
        const bl = new T.Group(); bl.rotation.y = r; bl.add(blade); hub.add(bl);
      });
      const disc = mesh(new T.CircleGeometry(0.44, 48), new T.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide }));
      disc.rotation.x = -Math.PI / 2; hub.add(disc);
      hub.userData.dir = k % 3 === 0 ? 1 : -1;
      craft.add(hub);
      props.push({ hub, disc });
    });
    return {
      group: g, craft, props,
      anchors: { camera: A([-0.05, -0.25, 0.58], [0, 0, 1]), sensors: A([0.1, 0.03, 0.48], [0.2, 0.1, 1]), battery: A([0, 0.19, -0.2], [0, 1, 0]), props: A([0.64, 0.12, 0.6], [0.3, 1, 0.3]) },
    };
  }

  const builders = { s5: buildS5, s9: buildS9, bm6k: buildBM6K, mavic: buildMavic };

  /* ───────── Stage ───────── */
  const pivot = new T.Group(); scene.add(pivot);       // user rotation
  const shadow = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({
    map: canvasTex(256, 256, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(0,0,0,.42)'); r.addColorStop(0.45, 'rgba(0,0,0,.14)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); }),
    transparent: true, depthWrite: false, toneMapped: false,
  }));
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  const models = {};
  function getModel(id) {
    if (models[id]) return models[id];
    const m = builders[id]();
    const inner = m.group;
    // normalise size and centre it
    const box = new T.Box3().setFromObject(inner), size = new T.Vector3(), center = new T.Vector3();
    box.getSize(size); box.getCenter(center);
    const s = (id === 'mavic' ? 2.7 : 2.35) / Math.max(size.x, size.y, size.z);
    const holder = new T.Group();
    inner.position.sub(center);
    holder.add(inner);
    holder.scale.setScalar(s);
    m.holder = holder;
    m.floor = -(size.y * s) / 2;
    models[id] = m;
    return m;
  }

  /* ───────── Hotspots ───────── */
  let spots = [];
  function buildSpots(d) {
    spotsEl.replaceChildren();
    spots = d.hotspots.map(h => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'hs'; b.dataset.cursor = 'link';
      b.setAttribute('aria-label', h.label);
      b.innerHTML = '<i></i><b></b>';
      b.querySelector('b').textContent = h.label;
      b.addEventListener('click', e => { e.stopPropagation(); focusSpot(h); });
      spotsEl.append(b);
      return { h, b };
    });
  }

  /* ───────── View state ───────── */
  const DEFAULT = { yaw: -0.62, pitch: 0.2 };
  let yaw = DEFAULT.yaw, pitch = DEFAULT.pitch, tYaw = yaw, tPitch = pitch, vYaw = 0;
  let dragging = false, lastX = 0, lastY = 0, moved = 0, lastInteract = performance.now();
  let swap = null;            // { phase: 'out'|'in', t, next }
  let recording = 0, flying = false, lift = 0, propSpeed = 0;

  const wrapAngle = a => Math.atan2(Math.sin(a), Math.cos(a));
  // Tapping a dot zooms in on that part and opens a callout beside it; tap it again (or empty space) to zoom out.
  let active = null, zoom = 0;
  const callout = $('g3d-callout');
  function clearSpot() {
    active = null;
    callout.classList.remove('on');
    spots.forEach(s => s.b.classList.remove('sel'));
    tPitch = DEFAULT.pitch;
  }
  function focusSpot(h) {
    const m = models[current]; const a = m && m.anchors[h.key];
    lastInteract = performance.now();
    if (active === h && !h.action) { clearSpot(); return; }
    active = h;
    spots.forEach(s => s.b.classList.toggle('sel', s.h === h));
    callout.querySelector('.gc-label').textContent = h.label;
    callout.querySelector('.gc-text').textContent = h.text;
    callout.classList.remove('on'); void callout.offsetWidth; callout.classList.add('on');
    showPart(h);
    if (h.action === 'record' && m.rec) recording = recording > 0 ? 0 : 1;
    if (h.action === 'takeoff') setFlying(!flying);
    if (!a) return;
    const n = a.n;
    const want = Math.atan2(-n.x, n.z) + (Math.abs(n.y) > 0.7 ? 0 : 0.28);
    tYaw = yaw + wrapAngle(want - yaw);
    tPitch = Math.max(-0.35, Math.min(0.95, Math.atan2(n.y, Math.hypot(n.x, n.z)) * 0.9 + 0.08));
    vYaw = 0;
  }

  function show(id) {
    const d = G.devices.find(x => x.id === id);
    const markTabs = () => tabs.forEach((t, i) => { const on = G.devices[i].id === id; t.setAttribute('aria-selected', String(on)); t.setAttribute('aria-pressed', String(on)); });
    if (!renderer) { if (id !== current) { markTabs(); fillPanel(d, current !== null); current = id; } return; }
    if (id === current && !swap) return;
    markTabs();
    fillPanel(d, current !== null);
    $('g3d-swatches').hidden = !d.colors;
    $('g3d-takeoff').hidden = id !== 'mavic';
    if (d.colors) buildSwatches(d);
    buildSpots(d);
    clearSpot();
    recording = 0;
    if (flying) setFlying(false);
    if (!current || reduce) { mount(id); current = id; return; }
    current = id;
    swap = { phase: 'out', t: 0, next: id };
  }
  function mount(id) {
    pivot.clear();
    const m = getModel(id);
    pivot.add(m.holder);
    shadow.position.y = m.floor - 0.04;
    catcher.position.y = m.floor - 0.035;
    yaw = DEFAULT.yaw - (reduce ? 0 : 1.1); tYaw = DEFAULT.yaw; tPitch = DEFAULT.pitch;
  }

  function buildSwatches(d) {
    const el = $('g3d-swatches');
    el.replaceChildren();
    d.colors.forEach(([name, hex], i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'swatch'; b.dataset.cursor = 'link';
      b.style.setProperty('--c', hex);
      b.setAttribute('aria-label', name); b.title = name;
      b.setAttribute('aria-pressed', String(i === 0));
      b.addEventListener('click', () => {
        el.querySelectorAll('.swatch').forEach(s => s.setAttribute('aria-pressed', String(s === b)));
        const m = getModel(d.id);
        paintTarget = new T.Color(hex);
        paintMats = m.paint;
        $('g3d-swatch-name').textContent = name;
      });
      el.append(b);
    });
    const label = document.createElement('span'); label.id = 'g3d-swatch-name'; label.textContent = d.colors[0][0];
    el.append(label);
  }
  let paintTarget = null, paintMats = null;

  function setFlying(on) {
    flying = on;
    const b = $('g3d-takeoff');
    b.textContent = on ? 'Land' : 'Take off';
    b.setAttribute('aria-pressed', String(on));
  }
  $('g3d-takeoff').addEventListener('click', () => { setFlying(!flying); lastInteract = performance.now(); });

  /* ───────── Pointer ───────── */
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; vYaw = 0;
    canvas.setPointerCapture(e.pointerId);
    lastInteract = performance.now();
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    tYaw += dx * 0.0085; yaw += dx * 0.0085;
    tPitch = Math.max(-0.35, Math.min(0.95, tPitch + dy * 0.006));
    vYaw = vYaw * 0.5 + dx * 0.0085 * 0.5;
    lastInteract = performance.now();
  });
  const end = () => { if (dragging && moved < 6 && active) clearSpot(); dragging = false; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', () => { dragging = false; vYaw = 0; });
  canvas.addEventListener('dblclick', () => { tYaw = yaw + wrapAngle(DEFAULT.yaw - yaw); tPitch = DEFAULT.pitch; vYaw = 0; });
  canvas.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') { tYaw -= 0.4; e.preventDefault(); }
    if (e.key === 'ArrowRight') { tYaw += 0.4; e.preventDefault(); }
    if (e.key === 'ArrowUp') { tPitch = Math.min(0.95, tPitch + 0.2); e.preventDefault(); }
    if (e.key === 'ArrowDown') { tPitch = Math.max(-0.35, tPitch - 0.2); e.preventDefault(); }
  });

  /* ───────── Sizing ───────── */
  let W = 1, H = 1, baseDist = 8.2;
  const look = new T.Vector3(0, -0.05, 0), lookGoal = new T.Vector3(), aw = new T.Vector3();
  function resize() {
    W = wrap.clientWidth; H = wrap.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    baseDist = camera.aspect >= 1.25 ? 8.2 : 8.2 * (camera.aspect < 1 ? 1.02 : 1.25) / camera.aspect;
    camera.position.set(0, 0.55, baseDist);
    camera.lookAt(0, -0.05, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  /* ───────── Loop ───────── */
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOutBack = t => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
  const tmp = new T.Vector3(), tmpN = new T.Vector3(), camDir = new T.Vector3(), q = new T.Quaternion();
  let lastT = 0, running = false, raf = 0;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60;
    lastT = now;
    const f60 = dt * 60, ease = k => (reduce ? 1 : 1 - Math.pow(1 - k, f60));
    const m = models[current];

    // rotation: drag inertia, then ease toward the target, idle auto-spin
    if (!dragging) {
      if (Math.abs(vYaw) > 0.0004) { tYaw += vYaw * f60; vYaw *= Math.pow(0.93, f60); }
      if (!reduce && now - lastInteract > 3500 && !swap && !active) tYaw += 0.12 * dt;
    }
    yaw = lerp(yaw, tYaw, ease(dragging ? 0.35 : 0.08));
    pitch = lerp(pitch, tPitch, ease(0.08));
    pivot.rotation.set(pitch, yaw, 0);

    // model swap: spin + shrink out, then pop the next one in
    if (swap) {
      swap.t += dt / (swap.phase === 'out' ? 0.32 : 0.75);
      const t = Math.min(1, swap.t);
      if (swap.phase === 'out') {
        pivot.scale.setScalar(Math.max(0.001, 1 - t * t));
        pivot.rotation.y += t * 0.9;
        if (t >= 1) { mount(swap.next); swap = { phase: 'in', t: 0 }; }
      } else {
        pivot.scale.setScalar(Math.max(0.001, easeOutBack(t)));
        if (t >= 1) { pivot.scale.setScalar(1); swap = null; }
      }
    }

    if (m) {
      // S9 paint
      if (paintTarget && paintMats) paintMats.forEach(mat => mat.color.lerp(paintTarget, ease(0.12)));
      // record: blinking tally and lit button
      if (m.tally) {
        const on = recording > 0 && (Math.floor(now / 500) % 2 === 0);
        m.tally.material.emissive.setHex(on ? 0xff1a3a : 0x000000);
        m.tally.material.emissiveIntensity = on ? 2.4 : 0;
        m.rec.material.emissive.setHex(recording > 0 ? 0x8a0a1f : 0x000000);
      }
      // drone: props spin up, craft lifts and bobs
      if (m.props) {
        propSpeed = lerp(propSpeed, flying ? 1 : 0, ease(flying ? 0.04 : 0.025));
        m.props.forEach(p => { p.hub.rotation.y += p.hub.userData.dir * propSpeed * 38 * dt; p.disc.material.opacity = Math.max(0, propSpeed - 0.35) * 0.32; });
        lift = lerp(lift, flying ? 0.32 : 0, ease(0.03));
        m.craft.position.y = lift + (flying && !reduce ? Math.sin(now / 520) * 0.025 : 0);
        m.craft.rotation.z = flying && !reduce ? Math.sin(now / 900) * 0.025 : 0;
        shadow.scale.setScalar(1 - lift * 0.6);
        shadow.material.opacity = 1 - lift * 1.4;
      } else { shadow.scale.setScalar(1); shadow.material.opacity = 1; }
    }
    shadow.scale.multiplyScalar(pivot.scale.x);

    // camera: dolly in toward the active part, back out when nothing is selected
    zoom = lerp(zoom, active && !swap ? 1 : 0, ease(0.07));
    lookGoal.set(0, -0.05, 0);
    if (m && active && m.anchors[active.key]) {
      pivot.updateMatrixWorld(true);
      aw.copy(m.anchors[active.key].p); (m.craft || m.group).localToWorld(aw);
      lookGoal.lerp(aw, 0.6);
    }
    look.lerp(lookGoal, ease(0.08));
    camera.position.set(look.x * 0.6, 0.55 + look.y * 0.5, baseDist * (1 - 0.26 * zoom));
    camera.lookAt(look);

    renderer.render(scene, camera);

    // hotspots follow their anchors and hide when they face away
    if (m && !swap) {
      camera.getWorldDirection(camDir);
      spots.forEach(({ h, b }) => {
        const a = m.anchors[h.key];
        if (!a) { b.style.opacity = 0; return; }
        const host = m.craft || m.group;   // drone anchors ride along when it lifts off
        tmp.copy(a.p); host.localToWorld(tmp);
        host.getWorldQuaternion(q);
        tmpN.copy(a.n).applyQuaternion(q);
        const facing = -tmpN.dot(camDir);
        const p = tmp.project(camera);
        b.style.transform = `translate(${((p.x + 1) / 2 * W).toFixed(1)}px, ${((1 - p.y) / 2 * H).toFixed(1)}px)`;
        const vis = facing > 0.05;
        b.style.opacity = vis ? Math.min(1, facing * 3).toFixed(2) : '0';
        b.style.pointerEvents = vis ? 'auto' : 'none';
        if (active === h) {
          // beside the dot, flipped to the left near the right edge, and always kept inside the viewer
          const x = (p.x + 1) / 2 * W, y = (1 - p.y) / 2 * H;
          const cw = callout.offsetWidth, ch = callout.offsetHeight;
          let cx = x + 24 + cw > W - 10 ? x - 24 - cw : x + 24;
          let cy = y - ch / 2;
          if (cx < 10) { cx = Math.min(Math.max(10, x - cw / 2), W - cw - 10); cy = y + 28; } // too narrow: drop below the dot
          cy = Math.min(Math.max(10, cy), H - ch - 10);
          callout.style.transform = `translate(${cx.toFixed(1)}px, ${cy.toFixed(1)}px)`;
        }
      });
    } else spots.forEach(({ b }) => { b.style.opacity = 0; b.style.pointerEvents = 'none'; });
  }

  function setRunning(on) {
    if (on === running) return;
    running = on; lastT = 0;
    if (on) raf = requestAnimationFrame(frame); else cancelAnimationFrame(raf);
  }
  let onScreen = false;
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; setRunning(onScreen && !document.hidden); }, { rootMargin: '100px' }).observe(wrap);
  document.addEventListener('visibilitychange', () => setRunning(onScreen && !document.hidden));

  show(G.devices[0].id);
  renderer.render(scene, camera);
  wrap.classList.add('ready');
})();
