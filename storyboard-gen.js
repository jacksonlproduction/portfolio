#!/usr/bin/env node
// CALL ME BACK — storyboard generator.
// Run `node storyboard-gen.js` to rebuild storyboard.html (the printable deliverable).
// Everything is hand-authored inline SVG: no images, no fonts, no runtime JavaScript.
'use strict';
const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ */
/* Palette: black line, three greys, white, one red accent             */
/* ------------------------------------------------------------------ */
const INK = '#1b1b1b';
const G1 = '#4f4f4f'; // dark grey
const G2 = '#8e8e8e'; // mid grey
const G3 = '#c6c6c6'; // light grey
const G4 = '#ececec'; // near white
const W = '#ffffff';
const RED = '#d7191c';
const FONT = 'Helvetica, Arial, sans-serif';

let PF = 'p'; // id prefix for the SVG currently being built (ids must be unique per page)

/* ------------------------------------------------------------------ */
/* Primitive helpers                                                   */
/* ------------------------------------------------------------------ */
const r1 = (n) => Math.round(n * 10) / 10;
const P = (a) => a.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' ');
const att = (fill, stroke, sw, extra = '') =>
  `fill="${fill}" stroke="${stroke}" stroke-width="${r1(sw)}" ${extra}`;

function poly(a, fill = 'none', stroke = INK, sw = 1, extra = '') {
  return `<polygon points="${P(a)}" ${att(fill, stroke, sw, 'stroke-linejoin="round" ' + extra)}/>`;
}
function pl(a, stroke = INK, sw = 1, extra = '') {
  return `<polyline points="${P(a)}" ${att('none', stroke, sw, 'stroke-linecap="round" stroke-linejoin="round" ' + extra)}/>`;
}
function ln(x1, y1, x2, y2, stroke = INK, sw = 1, extra = '') {
  return `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${r1(sw)}" stroke-linecap="round" ${extra}/>`;
}
function rect(x, y, w, h, fill, stroke = INK, sw = 1, rx = 0, extra = '') {
  return `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${r1(rx)}" ${att(fill, stroke, sw, extra)}/>`;
}
function circ(cx, cy, r, fill, stroke = INK, sw = 1, extra = '') {
  return `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" ${att(fill, stroke, sw, extra)}/>`;
}
function ell(cx, cy, rx, ry, fill, stroke = INK, sw = 1, extra = '') {
  return `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" ${att(fill, stroke, sw, extra)}/>`;
}
function pth(d, fill = 'none', stroke = INK, sw = 1, extra = '') {
  return `<path d="${d}" ${att(fill, stroke, sw, 'stroke-linecap="round" stroke-linejoin="round" ' + extra)}/>`;
}
function txt(x, y, s, size, o = {}) {
  const anchor = o.anchor || 'middle';
  const halo = o.halo ? `stroke="${o.halo}" stroke-width="${o.haloW || 3}" paint-order="stroke" stroke-linejoin="round"` : '';
  return `<text x="${r1(x)}" y="${r1(y)}" font-size="${r1(size)}" font-weight="${o.weight || 700}" text-anchor="${anchor}" fill="${o.fill || INK}" ${halo} ${o.extra || ''}>${s}</text>`;
}
const g = (inner, extra = '') => `<g ${extra}>${inner}</g>`;
const soft = (inner, level = 1) => {
  const f = level === 1 ? 'soft' : level === 2 ? 'soft2' : 'soft3';
  const op = level === 1 ? 0.6 : level === 2 ? 0.45 : 0.92;
  return `<g filter="url(#${PF}-${f})" opacity="${op}">${inner}</g>`;
};
const darken = (op) => `<rect x="-40" y="-40" width="400" height="260" fill="#000" opacity="${op}"/>`;
const tvGlow = (op = 1) => `<rect x="-40" y="-40" width="400" height="260" fill="url(#${PF}-tv)" opacity="${op}"/>`;
const glowAt = (cx, cy, r, op = 1) => circ(cx, cy, r, `url(#${PF}-glow)`, 'none', 0, `opacity="${op}"`);
function limb(a, w, fill, lw, outline = INK) {
  return pl(a, outline, w + 2 * lw) + pl(a, fill, w);
}

/* Arrows: SUBJECT = solid red line + filled head. CAMERA = dashed red line + open chevron head. */
function arrowPath(pts) {
  if (pts.length === 3) return `M${r1(pts[0][0])},${r1(pts[0][1])} Q${r1(pts[1][0])},${r1(pts[1][1])} ${r1(pts[2][0])},${r1(pts[2][1])}`;
  return 'M' + pts.map((p) => r1(p[0]) + ',' + r1(p[1])).join(' L');
}
function subj(pts, w = 2.6) {
  return `<path d="${arrowPath(pts)}" fill="none" stroke="${RED}" stroke-width="${w}" stroke-linecap="round" marker-end="url(#${PF}-ah)"/>`;
}
function cam(pts, w = 2.2) {
  return `<path d="${arrowPath(pts)}" fill="none" stroke="${RED}" stroke-width="${w}" stroke-dasharray="7 4" stroke-linecap="butt" marker-end="url(#${PF}-ahc)"/>`;
}
const label = (x, y, s, size = 10, anchor = 'middle') => txt(x, y, s, size, { halo: W, anchor });

function defs() {
  return `<defs>
<filter id="${PF}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter>
<filter id="${PF}-soft2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>
<filter id="${PF}-soft3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3.2"/></filter>
<radialGradient id="${PF}-glow"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.45" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="${PF}-tv" cx="0.5" cy="1.05" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="${PF}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5c5c5c"/><stop offset="1" stop-color="#b9b9b9"/></linearGradient>
<marker id="${PF}-ah" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3.4" markerHeight="3.4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="${RED}"/></marker>
<marker id="${PF}-ahc" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.4" markerHeight="4.4" orient="auto"><path d="M1,1 L8,5 L1,9" fill="none" stroke="${RED}" stroke-width="1.8" stroke-linecap="round"/></marker>
</defs>`;
}

/* ------------------------------------------------------------------ */
/* Characters                                                           */
/* ------------------------------------------------------------------ */
const SKIN = W;
const CL = {
  jack: { top: '#2a2a2a', hood: '#454545', pants: '#858585', hair: '#262626', shoe: '#1b1b1b' },
  nate: { top: '#dedede', pants: '#6a6a6a', hair: '#a9a9a9', shoe: '#f2f2f2', short: true },
  mom: { top: '#a2a2a2', inner: W, pants: '#5c5c5c', hair: '#5a5a5a', shoe: '#333333' },
};
// brow raise [inner, outer] in head units
const BROWS = {
  neutral: [0, 0], still: [-0.01, 0], sad: [0.11, -0.03], proud: [0.12, -0.02], set: [-0.025, 0.01],
  laugh: [0.06, 0.04], fade: [0.06, 0], open: [0.07, 0.02], worry: [0.08, 0],
};

function face(o, x, y, u, t, lw) {
  const rx = 0.8 * u, at = Math.abs(t), det = u >= 11;
  const gz = o.gaze || [0, 0], ex = o.expr || 'neutral';
  const br = BROWS[ex] || BROWS.neutral;
  let s = '';
  if (at >= 0.85) {
    // profile
    const d = Math.sign(t);
    s += pth(`M${r1(x + d * rx * 0.9)},${r1(y - 0.08 * u)} L${r1(x + d * (rx + 0.22 * u))},${r1(y + 0.3 * u)} L${r1(x + d * rx * 0.86)},${r1(y + 0.38 * u)}`, SKIN, INK, lw);
    const exx = x + d * rx * 0.52, ey = y + 0.02 * u;
    if (det) {
      s += ell(exx, ey, 0.09 * u, 0.08 * u, W, INK, lw * 0.7);
      s += circ(exx + d * 0.04 * u + gz[0] * 0.02 * u, ey + gz[1] * 0.03 * u, 0.055 * u, INK, 'none', 0);
      s += ln(exx - d * 0.1 * u, ey - 0.2 * u - br[1] * u, exx + d * 0.14 * u, ey - 0.23 * u - br[0] * u, INK, lw * 1.3);
    } else s += circ(exx, ey, Math.max(0.5, 0.08 * u), INK, 'none', 0);
    const my = y + 0.6 * u;
    if (ex === 'open') s += ell(x + d * rx * 0.78, my, 0.06 * u, 0.07 * u, INK, 'none', 0);
    else s += ln(x + d * rx * 0.6, my + (ex === 'smile' || ex === 'laugh' ? -0.03 * u : 0), x + d * rx * 0.86, my, INK, lw);
    return s;
  }
  const fc = x + t * 0.45 * rx;
  const es = 0.34 * u * (1 - 0.3 * at);
  const ey = y + 0.03 * u;
  for (const side of [-1, 1]) {
    const far = t !== 0 && side === Math.sign(t);
    const sq = far ? 1 - 0.45 * at : 1;
    const exx = fc + side * es * (far ? 0.85 : 1);
    if (det) {
      if (ex === 'laugh') {
        s += pth(`M${r1(exx - 0.14 * u * sq)},${r1(ey + 0.02 * u)} Q${r1(exx)},${r1(ey - 0.1 * u)} ${r1(exx + 0.14 * u * sq)},${r1(ey + 0.02 * u)}`, 'none', INK, lw * 1.2);
      } else {
        s += ell(exx, ey, 0.15 * u * sq, 0.085 * u, W, INK, lw * 0.75);
        s += circ(exx + gz[0] * 0.07 * u * sq, ey + gz[1] * 0.035 * u, 0.06 * u, INK, 'none', 0);
      }
      const ix = exx - side * 0.15 * u * sq, ox = exx + side * 0.19 * u * sq, by = ey - 0.23 * u;
      s += ln(ix, by - br[0] * u, ox, by - br[1] * u, INK, lw * 1.35);
      if (o.tear && !far) s += pth(`M${r1(exx + side * 0.05 * u)},${r1(ey + 0.12 * u)} q${r1(-0.02 * u)},${r1(0.12 * u)} ${r1(0.01 * u)},${r1(0.22 * u)}`, 'none', G2, lw * 0.9);
    } else {
      s += circ(exx + gz[0] * 0.05 * u, ey + gz[1] * 0.03 * u, Math.max(0.55, 0.085 * u), INK, 'none', 0);
    }
  }
  if (det) {
    s += pl([[fc + t * 0.06 * u, y + 0.12 * u], [fc + t * 0.18 * u + 0.03 * u * Math.sign(t || 1), y + 0.34 * u], [fc - 0.05 * u + t * 0.08 * u, y + 0.38 * u]], INK, lw * 0.8);
  }
  const mw = 0.24 * u * (1 - 0.25 * at), mx = fc + t * 0.05 * u, my = y + 0.6 * u;
  const mlw = Math.max(0.6, lw * 1.1);
  switch (ex) {
    case 'smile': s += pth(`M${r1(mx - mw)},${r1(my - 0.03 * u)} Q${r1(mx)},${r1(my + 0.1 * u)} ${r1(mx + mw)},${r1(my - 0.03 * u)}`, 'none', INK, mlw); break;
    case 'fade': s += pth(`M${r1(mx - mw * 0.8)},${r1(my)} Q${r1(mx)},${r1(my + 0.04 * u)} ${r1(mx + mw * 0.8)},${r1(my - 0.01 * u)}`, 'none', INK, mlw); break;
    case 'proud': s += pth(`M${r1(mx - mw * 0.85)},${r1(my - 0.01 * u)} Q${r1(mx)},${r1(my + 0.06 * u)} ${r1(mx + mw * 0.85)},${r1(my - 0.01 * u)}`, 'none', INK, mlw); break;
    case 'laugh': s += pth(`M${r1(mx - mw)},${r1(my - 0.04 * u)} Q${r1(mx)},${r1(my + 0.2 * u)} ${r1(mx + mw)},${r1(my - 0.04 * u)} Z`, G1, INK, mlw * 0.8); break;
    case 'sad': s += pth(`M${r1(mx - mw * 0.8)},${r1(my + 0.03 * u)} Q${r1(mx)},${r1(my - 0.05 * u)} ${r1(mx + mw * 0.8)},${r1(my + 0.03 * u)}`, 'none', INK, mlw); break;
    case 'open': s += ell(mx, my, 0.1 * u, 0.09 * u, G1, INK, mlw * 0.7); break;
    case 'set': s += ln(mx - mw * 0.9, my, mx + mw * 0.9, my - 0.01 * u, INK, mlw * 1.15); break;
    default: s += ln(mx - mw * 0.8, my, mx + mw * 0.8, my, INK, mlw);
  }
  return s;
}

function ears(x, y, u, t, back, lw, phase) {
  const rx = 0.8 * u, at = Math.abs(t);
  if (phase === 'mom') return '';
  const e = (cx) => ell(cx, y + 0.12 * u, 0.14 * u, 0.24 * u, SKIN, INK, lw * 0.8);
  if (phase === 'before') {
    if (back || at < 0.25) return e(x - rx * 0.97) + e(x + rx * 0.97);
    return '';
  }
  if (back || at < 0.25) return '';
  return ell(x - Math.sign(t) * rx * (0.97 - 0.75 * at * at), y + 0.12 * u, 0.12 * u, 0.21 * u, SKIN, INK, lw * 0.8);
}

function hair(o, x, y, u, t, back, lw) {
  const c = CL[o.who], rx = 0.8 * u, at = Math.abs(t), d = Math.sign(t) || 1;
  if (o.who === 'mom') {
    // shoulder-length bob framing the face
    if (back) return pth(`M${r1(x - rx * 1.18)},${r1(y + 1.45 * u)} C${r1(x - rx * 1.45)},${r1(y - 1.5 * u)} ${r1(x + rx * 1.45)},${r1(y - 1.5 * u)} ${r1(x + rx * 1.18)},${r1(y + 1.45 * u)} Z`, c.hair, INK, lw);
    const sh = t * 0.35 * rx;
    const L = x - rx * (1.1 + (t > 0 ? 0.12 * at : 0)), R = x + rx * (1.1 + (t < 0 ? 0.12 * at : 0));
    return pth(`M${r1(L)},${r1(y + 0.75 * u)} C${r1(L - 0.25 * rx)},${r1(y - 1.45 * u)} ${r1(R + 0.25 * rx)},${r1(y - 1.45 * u)} ${r1(R)},${r1(y + 0.75 * u)} ` +
      `L${r1(Math.min(R, x + sh + rx * 0.86))},${r1(y + 0.62 * u)} C${r1(x + sh + rx * 0.95)},${r1(y - 0.25 * u)} ${r1(x + sh + rx * 0.5)},${r1(y - 0.55 * u)} ${r1(x + sh + rx * 0.2)},${r1(y - 0.66 * u)} ` +
      `C${r1(x + sh - rx * 0.3)},${r1(y - 0.5 * u)} ${r1(x + sh - rx * 0.95)},${r1(y - 0.3 * u)} ${r1(Math.max(L, x + sh - rx * 0.86))},${r1(y + 0.62 * u)} Z`, c.hair, INK, lw);
  }
  // Jack and Nate: short cap
  let F, B;
  if (back) {
    return pth(`M${r1(x - rx * 1.03)},${r1(y + 0.25 * u)} C${r1(x - rx * 1.1)},${r1(y - 1.5 * u)} ${r1(x + rx * 1.1)},${r1(y - 1.5 * u)} ${r1(x + rx * 1.03)},${r1(y + 0.25 * u)} Q${r1(x)},${r1(y + 0.45 * u)} ${r1(x - rx * 1.03)},${r1(y + 0.25 * u)} Z`, c.hair, INK, lw) +
      (o.who === 'nate' ? curls(x, y, u, c.hair, lw, 0) : '');
  }
  if (at >= 0.85) {
    let s = o.who === 'nate' ? curls(x - d * 0.15 * rx, y - 0.1 * u, u, c.hair, lw, 0, d < 0 ? 1.22 : 1.1, d < 0 ? 1.9 : 1.78) : '';
    s += pth(`M${r1(x + d * rx * 0.72)},${r1(y - 0.62 * u)} C${r1(x + d * rx * 0.75)},${r1(y - 1.5 * u)} ${r1(x - d * rx * 1.5)},${r1(y - 1.4 * u)} ${r1(x - d * rx * 0.98)},${r1(y + 0.3 * u)} ` +
      `Q${r1(x - d * rx * 0.5)},${r1(y + 0.3 * u)} ${r1(x - d * rx * 0.45)},${r1(y - 0.2 * u)} Q${r1(x + d * rx * 0.1)},${r1(y - 0.7 * u)} ${r1(x + d * rx * 0.72)},${r1(y - 0.62 * u)} Z`, c.hair, INK, lw);
    return s;
  }
  const front = x + d * rx * 1.04, backX = x - d * rx * 1.05;
  F = [front, y - 0.22 * u];
  B = [backX, y + (-0.15 + 0.55 * at) * u];
  const hl = x + t * 0.35 * rx; // hairline centre shifts with the turn
  const top = o.who === 'nate' ? 1.55 : 1.42;
  let s = '';
  if (o.who === 'nate') s += curls(x, y, u, c.hair, lw, t);
  s += pth(`M${r1(F[0])},${r1(F[1])} C${r1(F[0])},${r1(y - top * u)} ${r1(B[0])},${r1(y - top * u)} ${r1(B[0])},${r1(B[1])} ` +
    `C${r1(B[0] + d * 0.25 * rx)},${r1(y - 0.25 * u)} ${r1(hl - d * 0.5 * rx)},${r1(y - 0.62 * u)} ${r1(hl)},${r1(y - 0.6 * u)} ` +
    `C${r1(hl + d * 0.45 * rx)},${r1(y - 0.62 * u)} ${r1(F[0] - d * 0.1 * rx)},${r1(y - 0.5 * u)} ${r1(F[0])},${r1(F[1])} Z`,
    c.hair, o.who === 'nate' ? 'none' : INK, lw);
  if (o.who === 'nate') s += pth(`M${r1(B[0])},${r1(B[1])} C${r1(B[0] + d * 0.25 * rx)},${r1(y - 0.25 * u)} ${r1(hl - d * 0.5 * rx)},${r1(y - 0.62 * u)} ${r1(hl)},${r1(y - 0.6 * u)} C${r1(hl + d * 0.45 * rx)},${r1(y - 0.62 * u)} ${r1(F[0] - d * 0.1 * rx)},${r1(y - 0.5 * u)} ${r1(F[0])},${r1(F[1])}`, 'none', INK, lw);
  return s;
}
// Nate's bushy, curly top: a ring of bumps that makes his silhouette taller and rounder than Jack's
function curls(x, y, u, fill, lw, t, a0 = 1.06, a1 = 1.94) {
  const rx = 0.8 * u;
  let s = '';
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI * (a0 + (a1 - a0) * i / 8);
    s += circ(x + Math.cos(a) * rx * 1.02 + t * 0.05 * u, y - 0.12 * u + Math.sin(a) * u * 1.0, 0.33 * u, fill, INK, lw * 0.8);
  }
  return s;
}

// A person. Coordinates: (x, y) = head centre, u = half head height. Limb points are in head units
// relative to the shoulder / hip they start from. turn: -1 (faces frame left) .. 0 (faces camera) .. 1 (faces frame right).
function person(o) {
  const c = CL[o.who], u = o.u, x = o.x, y = o.y;
  const t = o.turn ?? 0, bt = o.bodyTurn ?? t, back = !!o.back;
  const abt = Math.abs(bt);
  const rx = 0.8 * u;
  const lw = o.lw ?? Math.min(2.3, Math.max(0.55, u * 0.075));
  const prof = abt > 0.85;
  const N = [x + (o.neckDx ?? 0) * u, y + 1.3 * u];
  const sw = prof ? 0.78 * u : 1.5 * (1 - 0.28 * abt) * u * (o.broad ?? 1);
  const tl = o.tl ?? 3.4;
  const H = [N[0] + (o.lean ?? 0) * u, N[1] + tl * u];
  const hw = prof ? 0.85 * u : sw * 0.78;
  const sy = N[1] + 0.12 * u;
  const sh = { L: [N[0] - sw * 0.76, sy + 0.32 * u], R: [N[0] + sw * 0.76, sy + 0.32 * u] };
  const hip = { L: [H[0] - hw * 0.55, H[1] - 0.2 * u], R: [H[0] + hw * 0.55, H[1] - 0.2 * u] };
  if (prof) {
    sh.L = [N[0] - 0.12 * u, sy + 0.3 * u]; sh.R = [N[0] + 0.12 * u, sy + 0.3 * u];
    hip.L = [H[0] - 0.15 * u, H[1] - 0.25 * u]; hip.R = [H[0] + 0.15 * u, H[1] - 0.25 * u];
  }
  const rel = (a, ps) => [a, ...ps.map((p) => [a[0] + p[0] * u, a[1] + p[1] * u])];
  const armW = (o.who === 'jack' ? 0.7 : 0.6) * u, legW = 0.88 * u;
  const handR = 0.3 * u;
  const hands = [];
  const arm = (a) => {
    const p = rel(sh[a.s], a.p);
    let s = '';
    if (c.short) {
      s += limb(p, armW * 0.85, SKIN, lw);
      const p0 = p[0], p1 = p[1];
      s += limb([p0, [p0[0] + (p1[0] - p0[0]) * 0.45, p0[1] + (p1[1] - p0[1]) * 0.45]], armW * 1.05, c.top, lw);
    } else s += limb(p, armW, c.top, lw);
    if (!a.noHand) hands.push(circ(p[p.length - 1][0], p[p.length - 1][1], a.handR ? a.handR * u : handR, SKIN, INK, lw * 0.9));
    return s;
  };
  const leg = (l) => {
    const p = rel(hip[l.s], l.p);
    let s = limb(p, legW, c.pants, lw);
    const e = p[p.length - 1];
    if (l.foot) {
      const f = [e[0] + l.foot[0] * u, e[1] + l.foot[1] * u];
      s += limb([e, f], 0.5 * u, c.shoe, lw);
    } else if (!l.noFoot) s += ell(e[0], e[1] + 0.12 * u, 0.4 * u, 0.26 * u, c.shoe, INK, lw);
    return s;
  };
  let s = '';
  for (const l of o.legs || []) if (l.back) s += leg(l);
  for (const a of o.arms || []) if (a.back) s += arm(a);
  const torsoD = `M${r1(N[0] - sw)},${r1(sy + 0.55 * u)} Q${r1(N[0] - sw)},${r1(sy)} ${r1(N[0] - sw + 0.5 * u)},${r1(sy)} L${r1(N[0] + sw - 0.5 * u)},${r1(sy)} Q${r1(N[0] + sw)},${r1(sy)} ${r1(N[0] + sw)},${r1(sy + 0.55 * u)} L${r1(H[0] + hw)},${r1(H[1])} L${r1(H[0] - hw)},${r1(H[1])} Z`;
  if (o.hips ?? !!(o.legs && o.legs.length)) s += ell(H[0], H[1] - 0.05 * u, hw * 1.02, 0.45 * u, c.pants, INK, lw);
  s += pth(torsoD, c.top, INK, lw);
  // clothing markers
  if (o.who === 'jack') {
    if (back) s += pth(`M${r1(N[0] - 0.85 * u)},${r1(sy + 0.05 * u)} Q${r1(N[0] - 0.9 * u)},${r1(sy + 1.3 * u)} ${r1(N[0])},${r1(sy + 1.35 * u)} Q${r1(N[0] + 0.9 * u)},${r1(sy + 1.3 * u)} ${r1(N[0] + 0.85 * u)},${r1(sy + 0.05 * u)} Z`, c.hood, INK, lw * 0.9);
    else if (prof) s += ell(N[0] - Math.sign(bt) * 0.45 * u, sy + 0.1 * u, 0.55 * u, 0.42 * u, c.hood, INK, lw * 0.9);
    else s += ell(N[0] + bt * 0.2 * u, sy - 0.02 * u, 0.82 * u, 0.4 * u, c.hood, INK, lw * 0.9);
  }
  if (o.who === 'mom' && !back) {
    const ox = bt * 0.45 * u;
    s += poly([[N[0] + ox - 0.38 * u, sy], [N[0] + ox + 0.38 * u, sy], [H[0] + ox + 0.3 * u, H[1] - 0.1 * u], [H[0] + ox - 0.3 * u, H[1] - 0.1 * u]], c.inner, INK, lw * 0.8);
  }
  if (o.who === 'mom') s += hairBack(x, y, u, t, back, c.hair, lw);
  s += o.preHead || '';
  // neck
  s += rect(N[0] - 0.28 * u, y + 0.6 * u, 0.56 * u, N[1] - y - 0.5 * u, SKIN, INK, lw);
  if (o.who === 'nate' && !back && !prof) s += pth(`M${r1(N[0] - 0.42 * u)},${r1(sy + 0.02 * u)} Q${r1(N[0])},${r1(sy + 0.5 * u)} ${r1(N[0] + 0.42 * u)},${r1(sy + 0.02 * u)}`, SKIN, INK, lw);
  if (o.who === 'jack' && !back && !prof) {
    // hood-down drawstrings: the Jack marker
    for (const k of [-1, 1]) s += ln(N[0] + bt * 0.25 * u + k * 0.2 * u, sy + 0.3 * u, N[0] + bt * 0.25 * u + k * 0.24 * u, sy + 1.25 * u, W, Math.max(0.6, lw * 1.1));
  }
  s += ears(x, y, u, t, back, lw, o.who === 'mom' ? 'mom' : 'before');
  s += ell(x, y, rx, u, SKIN, INK, lw);
  if (o.light && !back) {
    const L = o.light === 'R';
    s += pth(`M${r1(x)},${r1(y - u)} A${r1(rx)},${r1(u)} 0 0 ${L ? 0 : 1} ${r1(x)},${r1(y + u)} A${r1(rx * 0.35)},${r1(u)} 0 0 ${L ? 1 : 0} ${r1(x)},${r1(y - u)} Z`, '#000', 'none', 0, 'opacity="0.13"');
  }
  if (!back && !o.noFace) s += face(o, x, y, u, t, lw);
  s += ears(x, y, u, t, back, lw, o.who === 'mom' ? 'mom' : 'after');
  s += hair(o, x, y, u, t, back, lw);
  for (const l of o.legs || []) if (!l.back) s += leg(l);
  for (const a of o.arms || []) if (!a.back) s += arm(a);
  s += o.items || '';
  s += hands.join('');
  s += o.top || '';
  return o.soft ? soft(s, o.soft) : s;
}
function hairBack(x, y, u, t, back, fill, lw) {
  const rx = 0.8 * u;
  const L = x - rx * (1.2 + (t > 0 ? 0.25 * Math.abs(t) : 0)), R = x + rx * (1.2 + (t < 0 ? 0.25 * Math.abs(t) : 0));
  return pth(`M${r1(L)},${r1(y - 0.2 * u)} C${r1(L - 0.2 * rx)},${r1(y + 0.7 * u)} ${r1(L - 0.15 * rx)},${r1(y + 1.3 * u)} ${r1(L + 0.15 * rx)},${r1(y + 1.62 * u)} L${r1(R - 0.15 * rx)},${r1(y + 1.62 * u)} C${r1(R + 0.15 * rx)},${r1(y + 1.3 * u)} ${r1(R + 0.2 * rx)},${r1(y + 0.7 * u)} ${r1(R)},${r1(y - 0.2 * u)} Z`, fill, INK, lw);
}

/* Common seated poses (front view) */
const lapArms = (spread = 1) => [
  { s: 'L', p: [[-0.25 * spread, 1.6], [0.95, 2.55]] },
  { s: 'R', p: [[0.25 * spread, 1.6], [-0.95, 2.55]] },
];
const seatedLegs = (drop = 4.2) => [
  { s: 'L', p: [[-0.15, 1.1], [-0.3, drop]] },
  { s: 'R', p: [[0.15, 1.1], [0.3, drop]] },
];

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */
// Smartphone, drawn upright in local coords then transformed. screen: call | vm | rec | lit | off
function phone(o) {
  const w = o.w, h = o.h, lw = o.lw ?? Math.max(0.6, w * 0.035);
  let s = `<g transform="translate(${r1(o.x)},${r1(o.y)}) rotate(${o.rot || 0}) skewX(${o.skew || 0}) scale(${o.sx || 1},${o.sy || 1})">`;
  if (o.glow) s += circ(0, 0, Math.max(w, h) * o.glow, `url(#${PF}-glow)`, 'none', 0, 'opacity="0.9"');
  s += rect(-w / 2, -h / 2, w, h, '#151515', INK, lw, w * 0.14);
  const m = w * 0.07, X = -w / 2 + m, Y = -h / 2 + m * 1.5, SW = w - 2 * m, SH = h - 3 * m;
  s += rect(X, Y, SW, SH, o.screen === 'off' ? '#3a3a3a' : W, 'none', 0, w * 0.06);
  const fs = SW * 0.2;
  if (o.screen === 'call') {
    s += circ(0, Y + SH * 0.24, SW * 0.15, G3, G2, lw * 0.6);
    s += txt(0, Y + SH * 0.52, 'MOM', SW * 0.27, { weight: 800 });
    s += txt(0, Y + SH * 0.67, 'CALLING', SW * 0.165, { weight: 700 });
    s += circ(-SW * 0.25, Y + SH * 0.87, SW * 0.1, G1, 'none', 0) + circ(SW * 0.25, Y + SH * 0.87, SW * 0.1, G2, 'none', 0);
  } else if (o.screen === 'vm') {
    s += circ(-SW * 0.12, Y + SH * 0.2, SW * 0.07, 'none', INK, lw) + circ(SW * 0.12, Y + SH * 0.2, SW * 0.07, 'none', INK, lw) + ln(-SW * 0.12, Y + SH * 0.2 + SW * 0.07, SW * 0.12, Y + SH * 0.2 + SW * 0.07, INK, lw);
    s += txt(0, Y + SH * 0.43, 'NEW', SW * 0.2, { weight: 800 });
    s += txt(0, Y + SH * 0.58, 'VOICEMAIL', SW * 0.155, { weight: 800 });
    s += txt(0, Y + SH * 0.76, '— MOM', SW * 0.2, { weight: 800 });
  } else if (o.screen === 'rec') {
    s += circ(0, Y + SH * 0.3, SW * 0.17, RED, 'none', 0);
    s += txt(0, Y + SH * 0.56, 'REC 0:04', SW * 0.17, { weight: 800 });
    for (let i = 0; i < 9; i++) {
      const hh = SH * (0.04 + 0.1 * Math.abs(Math.sin(i * 1.7)));
      s += rect(-SW * 0.36 + i * SW * 0.09, Y + SH * 0.74 - hh / 2, SW * 0.05, hh, G2, 'none', 0);
    }
  } else if (o.screen === 'mini') {
    s += txt(0, Y + SH * 0.6, 'MOM', SW * 0.32, { weight: 800 });
  }
  s += '</g>';
  return s;
}
// Cordless landline handset (upright in local coords). Speaker end at top.
function landline(o) {
  const L = o.len, w = L * 0.3, lw = o.lw ?? Math.max(0.6, L * 0.012);
  let s = `<g transform="translate(${r1(o.x)},${r1(o.y)}) rotate(${o.rot || 0})">`;
  const k1y = -L / 2 + L * 0.38;
  if (o.thumb1) for (const k of [0.1, 0.19, 0.28]) s += ell(-w * 0.52, k1y + L * k, w * 0.2, L * 0.045, SKIN, INK, lw * 1.2); // fingers wrapping the far side
  s += rect(-w / 2, -L / 2, w, L, '#3c3c3c', INK, lw, w * 0.35);
  for (let i = 0; i < 4; i++) s += ln(-w * 0.18, -L / 2 + L * (0.05 + i * 0.025), w * 0.18, -L / 2 + L * (0.05 + i * 0.025), G3, lw * 0.9);
  s += rect(-w * 0.32, -L / 2 + L * 0.17, w * 0.64, L * 0.12, '#d6d6d6', INK, lw * 0.7, 1);
  if (o.display && L > 70) s += txt(0, -L / 2 + L * 0.25, o.display, L * 0.05, { weight: 700 });
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
  let k1 = null;
  keys.forEach((k, i) => {
    const cx = (i % 3 - 1) * w * 0.27, cy = -L / 2 + L * (0.38 + Math.floor(i / 3) * 0.105);
    s += rect(cx - w * 0.11, cy - L * 0.035, w * 0.22, L * 0.07, '#f0f0f0', INK, lw * 0.6, L * 0.02);
    if (L > 60) s += txt(cx, cy + L * 0.022, k, L * 0.055, { weight: 700 });
    if (i === 0) k1 = [cx, cy];
  });
  s += circ(0, L / 2 - L * 0.05, L * 0.012, INK, 'none', 0);
  if (o.thumb1) {
    // palm on the near side, thumb reaching across to the "1" key
    s += ell(w * 0.6, k1[1] + L * 0.25, w * 0.4, L * 0.14, SKIN, INK, lw * 1.4);
    s += pth(`M${r1(w * 0.75)},${r1(k1[1] + L * 0.2)} Q${r1(w * 0.2)},${r1(k1[1] + L * 0.05)} ${r1(k1[0] - w * 0.02)},${r1(k1[1] - L * 0.005)}`, 'none', INK, w * 0.26 + 2 * lw);
    s += pth(`M${r1(w * 0.75)},${r1(k1[1] + L * 0.2)} Q${r1(w * 0.2)},${r1(k1[1] + L * 0.05)} ${r1(k1[0] - w * 0.02)},${r1(k1[1] - L * 0.005)}`, 'none', SKIN, w * 0.26);
    s += ell(k1[0] + w * 0.02, k1[1], w * 0.06, L * 0.012, 'none', G2, lw * 0.6);
  }
  s += '</g>';
  return s;
}
function controller(x, y, sc, rot = 0, lw = 0.8) {
  return `<g transform="translate(${r1(x)},${r1(y)}) rotate(${rot}) scale(${sc})">` +
    `<path d="M-1,-0.25 Q-1,-0.5 -0.62,-0.5 L0.62,-0.5 Q1,-0.5 1,-0.25 L1.08,0.42 Q1.1,0.82 0.74,0.74 L0.42,0.3 L-0.42,0.3 L-0.74,0.74 Q-1.1,0.82 -1.08,0.42 Z" fill="#3a3a3a" stroke="${INK}" stroke-width="${lw}" vector-effect="non-scaling-stroke"/>` +
    `<circle cx="-0.42" cy="-0.1" r="0.16" fill="#777" stroke="${INK}" stroke-width="${lw * 0.7}" vector-effect="non-scaling-stroke"/>` +
    `<circle cx="0.22" cy="0.08" r="0.16" fill="#777" stroke="${INK}" stroke-width="${lw * 0.7}" vector-effect="non-scaling-stroke"/>` +
    `<circle cx="0.62" cy="-0.22" r="0.07" fill="#bbb"/><circle cx="0.76" cy="-0.1" r="0.07" fill="#bbb"/><circle cx="0.48" cy="-0.1" r="0.07" fill="#bbb"/>` +
    `</g>`;
}
function can(x, y, s) {
  return rect(x - 2.2 * s, y - 6 * s, 4.4 * s, 6 * s, G3, INK, 0.5) + ell(x, y - 6 * s, 2.2 * s, 0.8 * s, G4, INK, 0.5);
}
function wrapper(x, y, s) {
  return poly([[x - 4 * s, y], [x - 2 * s, y - 2.5 * s], [x + 1 * s, y - 1.5 * s], [x + 4 * s, y - 3 * s], [x + 3.5 * s, y], [x, y + 0.8 * s]], W, INK, 0.5);
}
const buzz = (x, y, r, sw = 0.9) =>
  [-1, 1].map((k) => pth(`M${r1(x + k * r)},${r1(y - r * 0.6)} Q${r1(x + k * r * 1.25)},${r1(y)} ${r1(x + k * r)},${r1(y + r * 0.6)}`, 'none', INK, sw) +
    pth(`M${r1(x + k * r * 1.45)},${r1(y - r * 0.85)} Q${r1(x + k * r * 1.8)},${r1(y)} ${r1(x + k * r * 1.45)},${r1(y + r * 0.85)}`, 'none', INK, sw)).join('');
function shoe(x, y, len, rot, lw = 1.4) {
  // side-view sneaker, toe pointing right, (x,y) = heel bottom
  const L = len, H = len * 0.38;
  return `<g transform="translate(${r1(x)},${r1(y)}) rotate(${rot})">` +
    pth(`M0,0 L${r1(L * 0.82)},0 Q${r1(L * 1.02)},0 ${r1(L)},${r1(-H * 0.45)} Q${r1(L * 0.85)},${r1(-H * 0.85)} ${r1(L * 0.55)},${r1(-H * 0.85)} L${r1(L * 0.35)},${r1(-H * 1.15)} L${r1(L * 0.05)},${r1(-H * 1.15)} Q0,${r1(-H * 0.6)} 0,0 Z`, '#2c2c2c', INK, lw) +
    rect(0, -H * 0.18, L * 0.95, H * 0.18, W, INK, lw * 0.7, 1) +
    ln(L * 0.42, -H * 0.8, L * 0.5, -H * 0.55, W, lw * 0.8) + ln(L * 0.52, -H * 0.75, L * 0.6, -H * 0.5, W, lw * 0.8) +
    '</g>';
}
function streetlight(x, base, h, side = 1, lw = 1) {
  const top = base - h;
  return ln(x, base, x, top, G1, lw * 1.5) + pl([[x, top], [x + side * h * 0.12, top - h * 0.03], [x + side * h * 0.2, top]], G1, lw * 1.2) +
    glowAt(x + side * h * 0.2, top + h * 0.02, h * 0.22) + ell(x + side * h * 0.2, top + h * 0.015, h * 0.045, h * 0.018, W, INK, lw * 0.6);
}
function archD(cx, hw, spring, bottom) {
  return `M${r1(cx - hw)},${r1(bottom)} L${r1(cx - hw)},${r1(spring)} A${r1(hw)},${r1(hw)} 0 0 1 ${r1(cx + hw)},${r1(spring)} L${r1(cx + hw)},${r1(bottom)} Z`;
}

/* ------------------------------------------------------------------ */
/* NATE'S LIVING ROOM — master wide (camera in front of fireplace)      */
/* ------------------------------------------------------------------ */
// tod: day | sun | gold | dusk
function nateRoomBack(tod) {
  let s = '';
  const wall = tod === 'sun' || tod === 'gold' ? '#e2e2e2' : '#f6f6f6';
  s += rect(-40, -40, 400, 280, W, 'none', 0);
  s += poly([[-10, -10], [330, -10], [330, 6], [292, 24], [160, 3], [20, 24], [-10, 6]], '#e0e0e0', G2, 0.7); // vaulted ceiling
  s += ln(160, 3, 160, -10, G2, 0.7) + ln(20, 24, -10, 6, G2, 0.7) + ln(292, 24, 330, 2, G2, 0.7);
  s += poly([[-10, 6], [20, 24], [20, 112], [-10, 128]], '#efefef', G2, 0.7); // left wall
  s += poly([[292, 24], [330, 2], [330, 140], [292, 112]], '#efefef', G2, 0.7); // right wall
  s += poly([[20, 24], [160, 3], [292, 24], [292, 112], [20, 112]], wall, INK, 0.9); // back wall
  // dark wood floor
  s += poly([[-10, 128], [20, 112], [292, 112], [330, 140], [330, 240], [-10, 240]], '#a8a8a8', INK, 0.9);
  for (let x0 = 26; x0 < 292; x0 += 18) s += ln(x0, 112, 160 + (x0 - 160) * 3.2, 240, '#919191', 0.6);
  // hall arch, far left, one step up
  s += pth(archD(42, 13, 62, 112), '#cfcfcf', INK, 0.9);
  s += rect(29, 104, 26, 8, '#ededed', G2, 0.6);
  s += ln(29, 104, 55, 104, INK, 0.6);
  // kitchen arch, centre
  s += pth(archD(160, 32, 58, 112), '#dcdcdc', INK, 1);
  s += rect(134, 47, 52, 14, '#e8e8e8', G2, 0.6) + ln(160, 47, 160, 61, G2, 0.5);
  s += rect(129, 89, 62, 23, '#c3c3c3', G2, 0.7) + ln(129, 89, 191, 89, INK, 0.8);
  s += ln(160, 27, 160, 36, G2, 0.6) + pth('M155,40 Q160,34 165,40 Z', G2, G2, 0.5);
  // tall white shuttered doors on the right wall (daylight source)
  const top = (x) => 24 - (x - 292) * (22 / 38), bot = (x) => 112 + (x - 292) * (28 / 38);
  for (const [a, b] of [[296, 308], [311, 326]]) {
    const ta = bot(a) - (bot(a) - top(a)) * 0.86, tb = bot(b) - (bot(b) - top(b)) * 0.86;
    s += poly([[a, ta], [b, tb], [b, bot(b)], [a, bot(a)]], W, INK, 0.9);
    for (let i = 1; i < 12; i++) {
      const k = i / 12;
      s += ln(a + 1.2, ta + (bot(a) - ta) * k, b - 1.2, tb + (bot(b) - tb) * k, G3, 0.5);
    }
  }
  // white sectional against the left side
  s += poly([[-10, 98], [16, 101], [16, 118], [-10, 120]], W, INK, 0.8);
  s += poly([[-10, 118], [16, 116], [26, 119], [26, 131], [-10, 138]], W, INK, 0.8);
  s += ln(-10, 125, 26, 122, G3, 0.6);
  // sunlight
  if (tod === 'day') s += poly([[296, 113], [326, 133], [262, 168], [220, 138]], W, 'none', 0, 'opacity="0.55"');
  if (tod === 'sun') {
    s += poly([[204, 30], [246, 27], [240, 86], [198, 90]], W, G3, 0.6, 'stroke-dasharray="2 2"');
    s += poly([[252, 32], [284, 30], [280, 82], [247, 85]], W, G3, 0.6, 'stroke-dasharray="2 2"');
    s += poly([[296, 113], [326, 133], [250, 176], [205, 140]], W, 'none', 0, 'opacity="0.7"');
  }
  if (tod === 'gold') {
    for (const [y0, k] of [[44, 0], [70, 1]]) s += poly([[292, y0], [292, y0 + 8], [60, y0 + 46 + k * 6], [60, y0 + 34 + k * 6]], W, 'none', 0, 'opacity="0.85"');
    s += poly([[296, 113], [326, 133], [140, 200], [90, 160]], W, 'none', 0, 'opacity="0.5"');
  }
  return s;
}
function nateCouch() {
  const C = '#5e5e5e', T = '#717171';
  let s = '';
  s += rect(76, 87, 172, 33, C, INK, 1.1, 7); // back
  s += ln(136, 90, 136, 116, '#7a7a7a', 0.7) + ln(194, 90, 194, 116, '#7a7a7a', 0.7);
  s += poly([[98, 114], [204, 114], [204, 124], [98, 124]], T, INK, 0.9); // seat top
  s += rect(98, 124, 106, 19, C, INK, 1); // seat front
  s += ln(151, 114, 151, 143, '#7a7a7a', 0.7);
  s += poly([[204, 114], [246, 114], [262, 153], [196, 153]], T, INK, 0.9); // chaise top
  s += poly([[196, 153], [262, 153], [262, 167], [196, 167]], C, INK, 1); // chaise front
  s += poly([[63, 106], [99, 106], [101, 113], [61, 113]], T, INK, 0.9); // wide flat left arm
  s += rect(61, 113, 40, 30, C, INK, 1);
  s += rect(64, 143, 3, 3, INK, 'none', 0) + rect(198, 167, 3, 3, INK, 'none', 0) + rect(257, 167, 3, 3, INK, 'none', 0);
  return s;
}
const JACK_WIDE = { who: 'jack', x: 124, y: 85, u: 7, tl: 3.0, gaze: [0, -0.8], light: 'R', arms: lapArms(), legs: seatedLegs(), items: controller(124, 114.5, 4.2) };
const NATE_WIDE = {
  who: 'nate', x: 222, y: 87, u: 7, tl: 3.0, gaze: [0, -0.8], light: 'R', arms: lapArms(), items: controller(222, 116.5, 4.2),
  legs: [{ s: 'L', p: [[-0.3, 2.3], [-0.6, 4.8]], foot: [0, 0.7] }, { s: 'R', p: [[0.3, 2.3], [0.6, 4.8]], foot: [0, 0.7] }],
};
function nateWide(o) {
  let s = nateRoomBack(o.tod);
  s += nateCouch();
  const dusk = o.tod === 'dusk';
  if (dusk) s += darken(0.5);
  s += o.under || '';
  s += person({ ...JACK_WIDE, ...(o.jack || {}) });
  s += person({ ...NATE_WIDE, ...(o.nate || {}) });
  s += o.over || '';
  if (dusk) s += darken(0.18) + tvGlow(1);
  if (o.phoneLit !== false) s += glowAt(81, 109.5, 11, 0.9) + poly([[74, 108], [87, 108], [88.5, 111.5], [72.5, 111.5]], W, INK, 0.8);
  return s;
}

/* ------------------------------------------------------------------ */
/* Shot scenes                                                          */
/* ------------------------------------------------------------------ */
const S = {};

S[1] = () => nateWide({ tod: 'day' }) + buzz(81, 104, 4.5) + label(81, 96, 'phone', 7);

// Shot 2 / 5: close on the couch arm, camera low at the left end looking along the couch.
function armClose(o) {
  let s = '';
  const dusk = !!o.dusk;
  s += rect(-10, -10, 340, 200, '#f1f1f1', 'none', 0);
  s += rect(176, -10, 160, 140, '#f6f6f6', INK, 0.8); // far (right) wall
  for (const [a, b] of [[198, 238], [244, 284]]) {
    s += rect(a, 14, b - a, 110, W, INK, 1);
    for (let yy = 22; yy < 122; yy += 6) s += ln(a + 2, yy, b - 2, yy, G3, 0.7);
  }
  if (!dusk) s += glowAt(241, 66, 95, 0.85);
  s += poly([[-10, 160], [176, 130], [330, 130], [330, 190], [-10, 190]], '#a8a8a8', INK, 0.8); // floor
  s += ln(176, -10, 176, 130, INK, 0.8);
  // couch back receding along frame left, seat running away to the right
  s += poly([[-10, 22], [176, 84], [176, 118], [-10, 150]], '#5e5e5e', INK, 1.1);
  s += poly([[-10, 150], [176, 118], [214, 124], [214, 136], [-10, 190]], '#717171', INK, 1);
  if (dusk) s += darken(0.5);
  // Nate, far end, small and very soft
  s += person({ who: 'nate', x: 266, y: 76, u: 10, turn: 1, bodyTurn: 1, tl: 3, noFace: true, soft: 2, arms: [{ s: 'R', p: [[0.6, 1.2], [1.6, 1.6]] }] });
  // Jack beside the arm: soft (focus is on the phone). Body faces frame right (the TV), head turns toward the phone.
  const reach = o.state === 'press' || o.state === 'lift';
  s += person({
    who: 'jack', x: 150, y: 58, u: 27, turn: o.state === 'turn' ? -0.6 : -0.35, bodyTurn: 0.95, tl: 3.4, noFace: true, soft: 1,
    arms: reach ? [] : [{ s: 'R', p: [[0.7, 1.4], [1.7, 1.5]] }],
  });
  if (o.state === 'turn') s += subj([[186, 36], [170, 16], [138, 28]]) + label(196, 24, 'turns to look', 9, 'start');
  // the wide flat arm, in the foreground
  s += poly([[-10, 124], [196, 124], [214, 136], [236, 190], [-10, 190]], '#5c5c5c', INK, 1.4);
  s += poly([[-10, 124], [196, 124], [214, 136], [-10, 140]], '#6e6e6e', 'none', 0);
  s += ln(-10, 140, 214, 136, '#7c7c7c', 0.8);
  if (dusk) s += darken(0.35);
  const lifted = o.state === 'lift';
  if (o.state === 'press') {
    // his near (right) arm comes down from his shoulder; the hand is at the phone, so it is sharp
    s += soft(limb([[150, 104], [172, 128], [160, 146]], 17, CL.jack.top, 2.4, '#b5b5b5'), 3);
  }
  const ph = lifted ? { x: 104, y: 46, rot: -6, sy: 0.85, skew: -4 } : { x: 100, y: 152, rot: 0, sy: 0.52, skew: -16 };
  s += phone({ ...ph, w: 92, h: 104, screen: o.screen, glow: 1.0, lw: 2 });
  if (o.state === 'turn' || o.buzz) s += buzz(100, 152, 50, 1.6);
  if (o.state === 'press') {
    s += ell(154, 149, 10, 8, SKIN, INK, 1.6) + ell(145.5, 146, 5.5, 3.2, SKIN, INK, 1.4);
    s += label(232, 172, 'thumb on side button', 9);
  }
  if (lifted) {
    s += soft(limb([[150, 104], [172, 84], [152, 66]], 17, CL.jack.top, 2.4, '#b5b5b5'), 3);
    s += pth('M148,40 q11,-2 11,13 q0,15 -11,17 q-7,-2 -7,-13 z', SKIN, INK, 1.6);
    s += subj([[30, 70], [30, 8]]) + label(30, 84, 'lifts out', 9) + label(30, 95, 'of frame', 9);
  }
  return s;
}
S[2] = () => strip([
  { svg: armClose({ screen: 'call', state: 'turn' }) },
  { svg: armClose({ screen: 'call', state: 'press' }) },
]);

S[3] = () => {
  // camera raised to ~5 ft and tilted down: the room sits lower in frame and more floor shows
  const view = (z, inner) => `<g transform="translate(160,96) scale(${z}) translate(-160,-112)">${inner}</g>`;
  const slouch = { y: 91, tl: 2.6, legs: [{ s: 'L', p: [[-0.2, 1.6], [-0.4, 4.0]] }, { s: 'R', p: [[0.2, 1.6], [0.4, 4.0]] }] };
  const nateFeetUp = { y: 92, tl: 2.7, legs: [{ s: 'L', p: [[-0.3, 2.6], [-0.4, 5.3]], foot: [0, 0.8] }, { s: 'R', p: [[0.3, 2.6], [0.5, 5.3]], foot: [0, 0.8] }] };
  const litter = can(70, 107, 1.2) + can(92, 107, 1.2) + can(84, 104, 1.1) + can(116, 152, 1.4) + can(178, 154, 1.4) + wrapper(150, 151, 1.6) + wrapper(232, 162, 1.8) + wrapper(132, 158, 1.4) + can(190, 160, 1.4) + wrapper(90, 152, 1.5) + can(244, 157, 1.3);
  return strip([
    { svg: view(1.0, nateWide({ tod: 'sun', phoneLit: false })) },
    { svg: view(1.08, nateWide({ tod: 'day', phoneLit: false, jack: slouch, nate: nateFeetUp })) },
    { svg: view(1.16, nateWide({ tod: 'gold', phoneLit: false, jack: slouch, nate: nateFeetUp, over: litter })) },
    { svg: view(1.25, nateWide({ tod: 'dusk', phoneLit: true, jack: slouch, nate: nateFeetUp, over: litter })) },
  ]);
};

// Dusk interior used behind the medium/close shots in Nate's room
function nateDuskBg(o = {}) {
  let s = rect(-10, -10, 340, 200, '#ededed', 'none', 0);
  s += pth(archD(o.archX ?? 160, o.archW ?? 62, o.archSpring ?? 40, 120), '#cdcdcd', INK, 1);
  if (o.counter !== false) s += rect((o.archX ?? 160) - 50, 82, 100, 38, '#bdbdbd', G2, 0.8);
  return s;
}

S[4] = () => {
  let s = nateDuskBg();
  s += rect(-10, 96, 340, 100, '#5e5e5e', INK, 1.2, 12); // couch back
  s += ln(160, 100, 160, 190, '#7a7a7a', 0.8);
  s += darken(0.5);
  s += person({
    who: 'jack', x: 96, y: 58, u: 16, turn: -0.35, gaze: [-0.7, 1], expr: 'still', tl: 3.4, light: 'R',
    arms: [{ s: 'L', p: [[-0.7, 1.7], [-2.6, 3.6]] }, { s: 'R', p: [[0.2, 1.8], [-1.1, 2.7]] }],
    items: controller(84, 133, 9, 0, 1),
  });
  s += person({
    who: 'nate', x: 236, y: 60, u: 16, turn: -0.5, gaze: [-1, 0.5], expr: 'worry', tl: 3.4, light: 'R',
    arms: lapArms(), items: controller(236, 132, 9, 0, 1),
  });
  // couch arm + phone, frame left
  s += poly([[-10, 146], [48, 146], [54, 154], [-10, 156]], '#717171', INK, 1) + rect(-10, 155, 66, 40, '#5e5e5e', INK, 1);
  s += darken(0.15) + tvGlow(1);
  s += phone({ x: 24, y: 150, w: 26, h: 30, sy: 0.4, skew: -10, screen: 'mini', glow: 1.2, lw: 1 });
  s += buzz(24, 150, 17, 1.1);
  return s;
};

S[5] = () => strip([
  { svg: armClose({ dusk: true, screen: 'call', state: 'still', buzz: true }) },
  { svg: armClose({ dusk: true, screen: 'vm', state: 'lift' }) },
]);

S[6] = () => {
  let s = nateDuskBg({ archX: 70, archW: 50, counter: true });
  s += rect(-10, 112, 360, 100, '#5e5e5e', INK, 1.2, 14);
  s += darken(0.45);
  // TV glow from frame left (the TV is off frame left of the lens)
  s += glowAt(-20, 90, 170, 0.45);
  // phone at his far (left) ear: forearm rises behind his jaw, phone edge and fingertips show past the far cheek
  const pre = limb([[120, 200], [150, 150], [164, 118]], 30, CL.jack.top, 2) +
    rect(156, 50, 14, 62, '#151515', INK, 2, 4) + ell(164, 106, 10, 12, SKIN, INK, 1.8) + ell(158, 90, 6, 7, SKIN, INK, 1.6) + ell(158, 78, 5.5, 6, SKIN, INK, 1.6);
  s += person({
    who: 'jack', x: 196, y: 82, u: 40, turn: -0.5, bodyTurn: -0.25, gaze: [-1, -0.5], expr: 'still', tl: 3, light: 'L', lw: 2,
    preHead: pre,
  });
  // push-in: end frame + camera arrows
  s += rect(104, 26, 176, 99, 'none', RED, 1.6, 0, 'stroke-dasharray="7 4"');
  s += cam([[14, 8], [98, 22]]) + cam([[306, 8], [286, 22]]) + cam([[14, 172], [98, 130]]) + cam([[306, 172], [286, 130]]);
  s += label(198, 150, 'SLOW PUSH IN through the whole voicemail', 9.5);
  s += label(100, 46, 'phone at far ear', 8.5) + ln(130, 50, 154, 62, INK, 1);
  return s;
};

S[7] = () => {
  let s = rect(-10, -10, 340, 200, '#5e5e5e', 'none', 0); // couch seat
  // his thighs, seen from above: knees at the top of frame, hips toward the bottom
  s += pth('M40,200 L64,26 Q72,-4 110,-2 Q146,0 150,30 L156,200 Z', CL.jack.pants, INK, 1.8);
  s += pth('M168,200 L174,30 Q178,0 214,-2 Q252,0 256,28 L282,200 Z', CL.jack.pants, INK, 1.8);
  s += pth('M108,40 L112,200', 'none', '#777', 1) + pth('M214,40 L222,200', 'none', '#777', 1);
  s += rect(-10, 168, 340, 30, CL.jack.top, INK, 1.6, 6); // hoodie hem
  s += controller(150, 92, 58, -4, 1.8);
  // free (right) hand on the right grip: sleeve from bottom right, fingers under the grip, thumb resting on the stick
  s += limb([[330, 196], [232, 132]], 40, CL.jack.top, 1.8);
  s += pth('M186,104 Q200,92 222,98 Q240,108 236,130 Q228,146 206,142 Q188,136 186,120 Z', SKIN, INK, 1.8);
  for (const [x, y] of [[188, 128], [194, 136], [202, 141]]) s += ell(x, y, 6, 4.5, SKIN, INK, 1.3);
  s += pth('M204,104 Q190,94 168,96', 'none', INK, 14) + pth('M204,104 Q190,94 168,96', 'none', SKIN, 10.5);
  s += darken(0.25) + tvGlow(0.9);
  s += label(168, 70, 'thumb stopped', 10) + ln(168, 74, 168, 88, INK, 1.2);
  s += label(84, 152, 'left grip empty (phone hand)', 8.5);
  return s;
};

S[8] = () => {
  let s = nateDuskBg({ archX: 250, archW: 50 });
  s += rect(-10, 110, 360, 100, '#5e5e5e', INK, 1.2, 14);
  s += darken(0.4);
  s += glowAt(330, 90, 170, 0.4);
  s += person({
    who: 'nate', x: 182, y: 80, u: 40, turn: -0.3, bodyTurn: 0.35, gaze: [-1, 0.1], expr: 'worry', tl: 3, light: 'L', lw: 2,
    items: controller(196, 176, 24, -8, 1.6),
  });
  s += ell(170, 180, 11, 9, SKIN, INK, 1.8) + ell(222, 178, 11, 9, SKIN, INK, 1.8);
  // edge of Jack's shoulder, frame left, out of focus
  s += soft(pth('M-30,200 L-30,92 Q14,76 46,100 Q64,120 66,200 Z', CL.jack.top, '#b0b0b0', 4) + ell(6, 92, 34, 12, CL.jack.hood, '#b0b0b0', 3), 3);
  s += subj([[150, 148], [150, 176]]) + label(146, 144, 'lowers controller', 9, 'end');
  s += subj([[30, 150], [30, 70]]) + label(10, 62, "Jack's shoulder: he stands", 9, 'start');
  return s;
};

S[9] = () => {
  let s = rect(-10, -10, 340, 200, '#ececec', 'none', 0);
  s += rect(-10, 128, 340, 70, '#a8a8a8', INK, 0.8);
  s += pth(archD(62, 18, 62, 128), '#c9c9c9', INK, 1);
  s += rect(44, 118, 36, 10, '#e6e6e6', G2, 0.7) + ln(44, 118, 80, 118, INK, 0.7);
  s += pth(archD(160, 36, 70, 128), '#d6d6d6', INK, 1);
  s += rect(-10, 136, 220, 50, '#5e5e5e', INK, 1, 6); // couch back (soft background)
  s += darken(0.4);
  // Jack, deep background, soft, back to camera, stepping up through the hall arch
  s += person({ who: 'jack', x: 62, y: 80, u: 5.4, back: true, tl: 3.2, soft: 1, legs: [{ s: 'L', p: [[0, 2.8]], noFoot: true }, { s: 'R', p: [[0.1, 1.6], [0.3, 2.4]], noFoot: true }], arms: [{ s: 'L', p: [[-0.2, 2.2]] }, { s: 'R', p: [[0.2, 2.2]] }] });
  s += subj([[150, 150], [100, 140], [72, 110]]);
  s += label(64, 152, "Jack's path:", 8.5) + label(64, 163, 'up the step,', 8.5) + label(64, 174, 'through hall arch', 8.5);
  // Nate, foreground, sharp: right half of frame, looking back over his shoulder
  s += person({ who: 'nate', x: 236, y: 86, u: 46, turn: -1, bodyTurn: 0.55, tl: 3, gaze: [-1, 0], expr: 'neutral', light: 'R', lw: 2.2 });
  s += darken(0.06) + tvGlow(0.5);
  return s;
};

/* THE RUN */
function suburbBg(o = {}) {
  let s = `<rect x="-10" y="-10" width="340" height="200" fill="url(#${PF}-sky)"/>`;
  return s;
}
S[10] = () => {
  let s = suburbBg();
  // Nate's house: front door centred, porch light on
  s += rect(54, 34, 212, 66, '#d7d7d7', INK, 1);
  s += poly([[44, 36], [160, 4], [276, 36]], '#7a7a7a', INK, 1);
  s += rect(80, 50, 34, 24, '#9a9a9a', INK, 0.8) + rect(206, 50, 34, 24, W, INK, 0.8);
  s += rect(146, 56, 28, 44, '#6a6a6a', INK, 1) + circ(169, 79, 1.2, W, 'none', 0);
  s += glowAt(184, 58, 16) + circ(184, 58, 2, W, INK, 0.6);
  s += poly([[-10, 100], [330, 100], [330, 190], [-10, 190]], '#9d9d9d', INK, 0.8); // lawn
  s += poly([[140, 100], [180, 100], [268, 190], [52, 190]], '#c4c4c4', INK, 0.9); // driveway
  // Jack walking fast straight at camera
  s += person({
    who: 'jack', x: 160, y: 71, u: 6.5, tl: 3.2, expr: 'set', gaze: [0, 0],
    arms: [{ s: 'L', p: [[-0.5, 1.4], [-0.2, 2.6]] }, { s: 'R', p: [[0.45, 1.3], [0.6, 2.5]] }],
    legs: [{ s: 'L', p: [[-0.1, 1.9], [-0.25, 4.1]] }, { s: 'R', p: [[0.15, 1.6], [0.35, 3.4]] }],
  });
  s += subj([[180, 106], [192, 128]]) + label(198, 140, 'walks at camera', 8.5, 'start');
  // car trunk opening framing the shot
  s += poly([[-10, -10], [330, -10], [330, 10], [-10, 16]], '#2a2a2a', INK, 1);
  s += poly([[-10, 160], [330, 160], [330, 190], [-10, 190]], '#2a2a2a', INK, 1);
  s += rect(-10, 156, 340, 6, '#555', INK, 0.8);
  s += label(160, 176, 'TRUNK EDGE', 8, 'middle').replace(`fill="${INK}"`, `fill="${W}"`).replace(`stroke="${W}"`, `stroke="#2a2a2a"`);
  // pull back
  s += rect(110, 44, 100, 82, 'none', RED, 1.4, 0, 'stroke-dasharray="7 4"');
  s += cam([[108, 42], [70, 24]]) + cam([[212, 42], [250, 24]]) + cam([[108, 128], [70, 148]]) + cam([[212, 128], [250, 148]]);
  s += label(56, 134, 'CAR BACKS AWAY', 8.5);
  return s;
};

function streetSide(o = {}) {
  let s = suburbBg();
  for (const [x, w, h] of [[-10, 90, 48], [96, 104, 58], [214, 120, 50]]) {
    s += poly([[x, 112 - h], [x + w / 2, 112 - h - 22], [x + w, 112 - h]], '#7c7c7c', G1, 0.8);
    s += rect(x, 112 - h, w, h, '#a9a9a9', G1, 0.8);
    s += rect(x + w * 0.2, 112 - h + 12, w * 0.18, 14, W, G1, 0.6) + rect(x + w * 0.62, 112 - h + 12, w * 0.18, 14, '#d6d6d6', G1, 0.6);
  }
  s += rect(-10, 104, 340, 18, '#8a8a8a', G1, 0.8); // hedges
  s += rect(-10, 122, 340, 30, '#c9c9c9', G1, 0.8); // sidewalk
  for (let x = 0; x < 330; x += 40) s += ln(x, 122, x - 8, 152, G2, 0.6);
  s += rect(-10, 152, 340, 40, '#9a9a9a', G1, 0.8); // road
  return s;
}
S[11] = () => {
  let s = streetSide();
  s += soft(streetlight(250, 122, 104, -1, 1.4), 1);
  s += soft(streetlight(40, 122, 104, 1, 1.4), 1);
  // Jack in profile, head to knee, running left to right
  s += person({
    who: 'jack', x: 108, y: 36, u: 20, turn: 1, bodyTurn: 1, tl: 3.1, lean: 0.55, expr: 'set', light: 'R',
    arms: [
      { s: 'L', p: [[-0.9, 1.4], [-1.1, 0.4]], back: true },
      { s: 'R', p: [[0.7, 1.5], [1.6, 0.6]] },
    ],
    legs: [
      { s: 'L', p: [[-1.1, 1.8], [-2.2, 3.4]], back: true, noFoot: true },
      { s: 'R', p: [[1.3, 1.5], [1.2, 3.6]], noFoot: true },
    ],
  });
  s += subj([[178, 70], [252, 70]]) + label(214, 62, 'runs', 9);
  s += cam([[40, 172], [280, 172]]) + label(160, 166, 'CAMERA TRACKS ALONGSIDE', 9);
  return s;
};

S[12] = () => {
  let s = suburbBg();
  s += soft(rect(-10, 112, 120, 80, '#888', 'none', 0) + poly([[-10, 112], [50, 92], [110, 112]], '#777', 'none', 0) + rect(220, 120, 120, 70, '#888', 'none', 0), 2);
  s += ln(262, 190, 262, 4, G1, 4) + pl([[262, 6], [244, 2], [232, 8]], G1, 3);
  s += glowAt(228, 14, 60) + ell(228, 12, 9, 4, W, INK, 1);
  // light falling across his face from above-right
  s += poly([[226, 14], [234, 14], [190, 120], [130, 104]], W, 'none', 0, 'opacity="0.18"');
  s += person({
    who: 'jack', x: 158, y: 80, u: 34, turn: 0.05, bodyTurn: 0.15, gaze: [0, 0], expr: 'set', tl: 3, light: 'R', lw: 2,
  });
  s += cam([[40, 120], [40, 166]]) + label(40, 112, 'CAMERA LEADS,', 8.5) + label(40, 178, 'backing up', 8.5);
  s += subj([[96, 150], [96, 172]]) + label(96, 142, 'toward lens', 8);
  return s;
};

S[13] = () => {
  let s = rect(-10, -10, 340, 200, '#808080', 'none', 0);
  s += soft(rect(-10, 40, 340, 50, '#9a9a9a', 'none', 0) + glowAt(60, 30, 26) + glowAt(250, 34, 22), 2);
  s += poly([[-10, 112], [330, 112], [330, 190], [-10, 190]], '#b4b4b4', INK, 1);
  for (let i = 0; i < 8; i++) s += ln(-10 + i * 48, 112, -60 + i * 62, 190, G2, 0.7);
  s += ln(-10, 124, 330, 124, G2, 0.8);
  // rear foot pushing off (heel up), front foot striking
  s += limb([[40, -10], [78, 104]], 30, CL.jack.pants, 1.6);
  s += shoe(62, 112, 64, 30, 1.6);
  s += limb([[214, -10], [206, 112]], 30, CL.jack.pants, 1.6);
  s += shoe(192, 142, 66, -14, 1.6);
  s += ell(224, 146, 36, 4, '#000', 'none', 0, 'opacity="0.18"');
  s += label(84, 166, 'push off', 8.5) + label(226, 166, 'heel strike', 8.5);
  s += subj([[250, 70], [312, 70]]) + label(281, 62, 'left to right', 9);
  s += label(160, 14, 'CAMERA ON THE GROUND', 8.5);
  return s;
};

S[14] = () => {
  let s = suburbBg();
  const VP = [160, 80];
  s += poly([[-10, 190], [330, 190], [330, 92], [-10, 92]], '#8a8a8a', 'none', 0);
  // houses both sides
  for (const side of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const z = 1 / (1 + k * 0.75), z2 = 1 / (1 + (k + 0.7) * 0.75);
      const xa = 160 + side * 190 * z, xb = 160 + side * 190 * z2;
      const ya = 80 + 50 * z, yb = 80 + 50 * z2;
      const ha = 70 * z, hb = 70 * z2;
      s += poly([[xa, ya], [xb, yb], [xb, yb - hb], [xa, ya - ha]], '#a2a2a2', G1, 0.7);
      s += poly([[xa, ya - ha], [xb, yb - hb], [(xa + xb) / 2, (ya + yb) / 2 - (ha + hb) / 2 - 18 * z]], '#727272', G1, 0.6);
      s += poly([[xa + (xb - xa) * 0.35, ya + (yb - ya) * 0.35 - ha * 0.55], [xa + (xb - xa) * 0.6, ya + (yb - ya) * 0.6 - hb * 0.55], [xa + (xb - xa) * 0.6, ya + (yb - ya) * 0.6 - hb * 0.3], [xa + (xb - xa) * 0.35, ya + (yb - ya) * 0.35 - ha * 0.3]], k % 2 ? W : '#d8d8d8', G1, 0.5);
    }
  }
  // sidewalks + road
  s += poly([[-10, 190], [330, 190], [176, 80], [144, 80]], '#c6c6c6', 'none', 0);
  s += poly([[30, 190], [290, 190], [168, 80], [152, 80]], '#9a9a9a', INK, 0.8);
  for (let i = 0; i < 9; i++) {
    const a = 1 - i / 9, b = 1 - (i + 0.5) / 9;
    const ya = 80 + 110 * a * a, yb = 80 + 110 * b * b;
    s += ln(160, ya, 160, yb, W, 0.4 + 2.6 * a * a);
  }
  // streetlights receding both sides
  for (const side of [-1, 1]) for (let k = 0; k < 6; k++) {
    const z = 1 / (1 + k * 0.6);
    const x = 160 + side * 138 * z, base = 80 + 110 * z * 0.95;
    s += streetlight(x, base, 120 * z, -side, Math.max(0.4, 1.4 * z));
  }
  // Jack: tiny, centred, lower third, sprinting toward camera
  s += person({ who: 'jack', x: 160, y: 136, u: 2.0, tl: 3.2, lw: 0.45, noFace: true, arms: [{ s: 'L', p: [[-0.6, 1.3], [-0.1, 2.2]] }, { s: 'R', p: [[0.6, 1.0], [0.8, 0.0]] }], legs: [{ s: 'L', p: [[-0.2, 1.7], [-0.3, 3.4]] }, { s: 'R', p: [[0.2, 1.3], [0.3, 2.6]] }] });
  s += subj([[172, 136], [172, 156]], 2) + label(178, 156, 'Jack', 8.5, 'start');
  s += label(160, 12, 'LOCKED OFF · SYMMETRICAL', 8.5);
  return s;
};

S[15] = () => {
  let s = rect(-10, -10, 340, 200, '#bdbdbd', 'none', 0);
  for (let y = 6; y < 190; y += 12) s += ln(-10, y, 196, y, '#a7a7a7', 0.7); // siding
  s += rect(196, -10, 92, 210, '#d7d7d7', INK, 1.2); // door frame
  s += rect(206, 4, 72, 190, '#7d7d7d', INK, 1.4); // door
  s += rect(216, 16, 52, 62, '#8d8d8d', INK, 0.8) + rect(216, 92, 52, 70, '#8d8d8d', INK, 0.8);
  s += rect(212, 110, 6, 14, G4, INK, 0.8) + rect(212, 114, 20, 4, G4, INK, 0.8);
  s += glowAt(304, 36, 40) + rect(298, 24, 12, 18, W, INK, 1);
  s += person({
    who: 'jack', x: 140, y: 42, u: 17, turn: 0.95, bodyTurn: 1, tl: 3.1, lean: 0.35, expr: 'open', gaze: [0.6, 0.2],
    arms: [{ s: 'L', p: [[-0.3, 1.6], [0.3, 2.6]], back: true }, { s: 'R', p: [[0.5, 1.4], [2.4, 1.6]] }],
    legs: [{ s: 'L', p: [[-0.6, 2.0], [-0.8, 3.6]], back: true, noFoot: true }, { s: 'R', p: [[0.5, 2.0], [0.6, 3.8]], noFoot: true }],
  });
  s += [[164, 58], [172, 62]].map(([x, y], i) => ell(x + i * 4, y, 4 + i * 2, 3 + i, W, G2, 0.7, 'opacity="0.9"')).join('');
  s += label(176, 54, 'out of breath', 8, 'start');
  s += subj([[14, 128], [74, 128]]) + label(42, 120, 'arrives from left', 8.5);
  return s;
};

S[16] = () => {
  let s = rect(-10, -10, 340, 200, '#8a8a8a', 'none', 0);
  s += rect(250, -10, 80, 200, '#7a7a7a', INK, 1.2);
  s += circ(232, 96, 24, '#e2e2e2', INK, 1.8);
  s += pth('M232,86 L70,82 Q58,82 58,94 Q58,106 70,106 L232,104 Z', '#ececec', INK, 2);
  // hand squeezing the lever, sleeve from frame left
  s += limb([[-20, 128], [60, 118]], 46, CL.jack.top, 2);
  s += pth('M84,70 Q120,64 140,76 Q150,90 144,112 Q132,128 98,126 Q76,120 74,100 Q72,80 84,70 Z', SKIN, INK, 2);
  for (const x of [100, 114, 128]) s += pth(`M${x},106 q2,-10 4,-20`, 'none', INK, 1.2);
  s += pth('M86,74 Q110,66 136,74', 'none', INK, 1.2);
  for (const [x1, y1, x2, y2] of [[150, 60, 158, 52], [156, 72, 166, 68], [150, 124, 160, 132]]) s += ln(x1, y1, x2, y2, INK, 1.6);
  s += rect(0, 0, 320, 28, INK, 'none', 0) + txt(160, 19, 'JUMP CUT · MID-WORD', 15, { fill: W, weight: 800, extra: 'letter-spacing="1"' });
  s += pth('M300,28 L310,60 L298,92 L312,128 L300,160 L310,180', 'none', W, 2.5);
  return s;
};

/* JACK'S LIVING ROOM */
function jackRoomBg(o = {}) {
  let s = rect(-10, -10, 340, 200, '#f2f2f2', 'none', 0);
  s += rect(-10, -10, 340, 18, '#e2e2e2', G2, 0.7);
  s += poly([[-10, 112], [330, 112], [330, 190], [-10, 190]], '#bcbcbc', INK, 0.9);
  for (let x = 0; x < 330; x += 26) s += ln(x, 112, 160 + (x - 160) * 2.4, 190, '#aaa', 0.5);
  s += rect(208, 30, 54, 50, '#4a4a4a', INK, 1) + ln(235, 30, 235, 80, G2, 1) + ln(208, 55, 262, 55, G2, 1); // window, night
  s += rect(200, 26, 8, 62, '#d4d4d4', G2, 0.6) + rect(262, 26, 8, 62, '#d4d4d4', G2, 0.6);
  s += rect(52, 40, 30, 22, W, INK, 0.8) + rect(56, 44, 22, 14, '#d9d9d9', G2, 0.5); // picture
  // floor lamp, left
  s += ln(36, 112, 36, 54, INK, 1.2) + poly([[28, 54], [44, 54], [40, 42], [32, 42]], W, INK, 1) + glowAt(36, 56, 30, 0.9);
  // side table with the landline base, right
  s += rect(266, 92, 26, 20, '#cfcfcf', INK, 0.8) + rect(272, 87, 14, 5, '#444', INK, 0.6);
  return s;
}
function jackCouch() {
  const C = '#8b8b8b', T = '#9d9d9d';
  let s = rect(80, 87, 160, 33, C, INK, 1.1, 7);
  s += ln(133, 90, 133, 116, '#a3a3a3', 0.7) + ln(187, 90, 187, 116, '#a3a3a3', 0.7);
  s += poly([[96, 114], [224, 114], [224, 124], [96, 124]], T, INK, 0.9);
  s += rect(96, 124, 128, 19, C, INK, 1);
  s += ln(160, 114, 160, 143, '#a3a3a3', 0.7);
  for (const x of [66, 222]) s += rect(x, 104, 32, 39, C, INK, 1, 5);
  s += rect(70, 143, 3, 3, INK, 'none', 0) + rect(248, 143, 3, 3, INK, 'none', 0);
  return s;
}

S[17] = () => {
  let s = jackRoomBg();
  s += rect(-10, 120, 340, 80, '#8b8b8b', INK, 1, 10);
  s += person({
    who: 'mom', x: 210, y: 74, u: 27, turn: -0.25, gaze: [-0.6, 1], expr: 'sad', tl: 3, lw: 1.8, broad: 1.05,
    arms: [{ s: 'L', p: [[-0.3, 1.8], [-0.4, 2.8]] }],
  });
  s += person({
    who: 'jack', x: 112, y: 72, u: 27, turn: 0.1, gaze: [0.4, 0.6], expr: 'laugh', tl: 3, lw: 1.8, broad: 1.05,
    arms: [
      { s: 'L', p: [[-0.6, 1.0], [0.55, -1.75]], handR: 0.36 },
      { s: 'R', p: [[0.3, 1.6], [1.1, 1.8]] },
    ],
  });
  s += landline({ x: 162, y: 172, len: 64, rot: 8 });
  s += ell(146, 176, 9, 8, SKIN, INK, 1.6);
  s += label(64, 36, 'wipes eyes', 8.5);
  return s;
};

S[18] = () => {
  let s = jackRoomBg();
  s += rect(-10, 116, 340, 80, '#8b8b8b', INK, 1, 10);
  s += person({ who: 'jack', x: 136, y: 84, u: 40, turn: 0.45, bodyTurn: 0.25, gaze: [0.5, 1], expr: 'fade', tl: 3, lw: 2 });
  s += soft(hairBack(352, 70, 44, -0.3, false, CL.mom.hair, 2) + pth('M262,200 Q270,128 330,118 L340,200 Z', CL.mom.top, INK, 2), 3);
  s += rect(6, 6, 64, 20, INK, 'none', 0, 3) + txt(38, 20.5, 'SAFETY', 12, { fill: W, weight: 800 });
  s += label(296, 108, 'Mom (soft)', 8.5);
  return s;
};

S[19] = () => {
  let s = jackRoomBg();
  s += rect(-10, 116, 340, 80, '#8b8b8b', INK, 1, 10);
  s += person({ who: 'mom', x: 186, y: 84, u: 40, turn: -0.45, bodyTurn: -0.2, gaze: [-1, 0.1], expr: 'proud', tear: true, tl: 3, lw: 2 });
  s += soft(pth('M-20,200 L-20,104 Q20,90 50,116 Q62,140 64,200 Z', CL.jack.top, INK, 2) + ell(-6, 60, 30, 40, CL.jack.hair, INK, 2), 3);
  s += label(28, 92, 'Jack (soft)', 8.5);
  return s;
};

S[20] = () => {
  let s = jackRoomBg();
  s += jackCouch();
  s += person({ ...JACK_WIDE, x: 144, y: 85, light: null, gaze: [0, -0.4], arms: lapArms(0.6), items: landline({ x: 144, y: 114, len: 12, rot: 80, lw: 0.5 }) });
  s += person({ who: 'mom', x: 178, y: 86, u: 7, tl: 3.0, gaze: [-0.4, 0.5], arms: lapArms(), legs: seatedLegs() });
  s += label(160, 170, 'compose to match shot 1', 8.5);
  return s;
};

S[21] = () => {
  let s = rect(-10, -10, 340, 200, '#bcbcbc', 'none', 0); // floor beyond their knees
  for (let x = -40; x < 360; x += 28) s += ln(x, -10, 160 + (x - 160) * 0.5, 60, '#aaa', 0.6);
  s += rect(-10, 60, 340, 140, '#8b8b8b', INK, 1); // couch seat
  // laps seen from behind and above: thighs run away from camera, knees toward the top
  const thigh = (x0, x1, top, fill) => pth(`M${x0},200 L${x0 + 10},${top + 16} Q${(x0 + x1) / 2},${top - 8} ${x1 - 10},${top + 16} L${x1},200 Z`, fill, INK, 1.5);
  s += thigh(54, 112, 54, CL.mom.pants);
  s += thigh(158, 206, 40, CL.jack.pants) + thigh(206, 256, 40, CL.jack.pants);
  // Jack's forearms + hands holding the handset in his lap
  s += limb([[160, 200], [176, 140]], 24, CL.jack.top, 1.6) + limb([[262, 200], [226, 140]], 24, CL.jack.top, 1.6);
  s += landline({ x: 202, y: 104, len: 96, rot: 0, display: 'MSG 1' });
  s += ell(180, 132, 10, 13, SKIN, INK, 1.6) + ell(224, 132, 10, 13, SKIN, INK, 1.6);
  // shoulders framing both edges, out of focus. From behind: Mom frame LEFT, Jack frame RIGHT.
  s += soft(hairBack(16, 10, 44, 0.3, false, CL.mom.hair, 2) + pth('M-40,200 L-40,70 Q20,46 62,96 Q76,136 72,200 Z', CL.mom.top, INK, 2), 3);
  s += soft(ell(312, 8, 46, 50, CL.jack.hair, INK, 2) + pth('M360,200 L360,66 Q300,46 262,96 Q250,136 252,200 Z', CL.jack.top, INK, 2) + ell(292, 76, 40, 20, CL.jack.hood, INK, 2), 3);
  s += label(26, 176, 'MOM', 10) + label(296, 176, 'JACK', 10);
  return s;
};

function look(state) {
  let s = jackRoomBg();
  s += rect(30, 50, 260, 80, '#8b8b8b', INK, 1.1, 10);
  s += rect(10, 126, 300, 80, '#9d9d9d', INK, 1);
  const legs = [{ s: 'L', p: [[-0.25, 1.35], [-0.35, 3.6]] }, { s: 'R', p: [[0.25, 1.35], [0.35, 3.6]] }];
  const J = {
    who: 'jack', x: 112, y: 34, u: 21, tl: 2.9, lw: 1.6, legs,
    turn: state === 'a' ? 0.7 : state === 'b' ? 0.45 : 0.05, gaze: state === 'c' ? [0.1, 1] : [1, 0.2],
    expr: state === 'c' ? 'still' : 'fade',
  };
  const M = { who: 'mom', x: 214, y: 36, u: 21, tl: 2.9, lw: 1.6, turn: -0.5, gaze: [-1, 0.2], expr: 'proud', legs };
  if (state === 'c') {
    J.arms = [{ s: 'L', p: [[-0.25, 1.6], [0.7, 1.5]] }, { s: 'R', p: [[0.25, 1.6], [-0.3, 1.1]] }];
    J.items = landline({ x: 102, y: 92, len: 34, rot: -16 }) + phone({ x: 132, y: 80, w: 20, h: 34, rot: 6, screen: 'rec', lw: 1 });
  } else {
    J.arms = lapArms(0.7);
    J.items = landline({ x: 112, y: 118, len: 30, rot: 75 });
  }
  M.arms = state === 'a' ? lapArms() : [{ s: 'R', p: [[0.3, 1.6], [-0.9, 2.5]] }];
  s += person(M);
  if (state !== 'a') s += limb([[192, 74], [150, 70], [92, 72]], 12, CL.mom.top, 1.4); // her arm behind his shoulders
  s += person(J);
  if (state !== 'a') s += ell(86, 70, 7, 6, SKIN, INK, 1.3); // her hand on his far shoulder
  if (state === 'a') s += subj([[148, 10], [178, 6]], 2.6);
  if (state === 'b') s += subj([[206, 104], [150, 8], [90, 58]], 2.6);
  if (state === 'c') s += subj([[166, 112], [166, 76]], 2.6);
  return s;
}
S[22] = () => strip([{ svg: look('a') }, { svg: look('b') }, { svg: look('c') }]);

S[23] = () => {
  let s = rect(-10, -10, 340, 200, CL.jack.pants, 'none', 0); // his lap, far below the hands
  s += ln(170, -10, 140, 200, '#777', 1) + ln(60, -10, 24, 200, '#777', 1);
  // LEFT hand (frame left) holds his own phone, screen up
  s += limb([[-30, 200], [64, 128]], 42, CL.jack.top, 1.8);
  s += phone({ x: 118, y: 56, w: 64, h: 106, rot: -8, screen: 'rec', lw: 2 });
  s += pth('M70,112 Q62,90 72,66 Q86,58 92,74 L96,114 Q84,128 70,112 Z', SKIN, INK, 1.8);
  for (const y of [64, 78, 92]) s += ell(156, y, 7, 5.5, SKIN, INK, 1.4);
  // RIGHT hand (frame right) holds the landline: speaker end pressed to the bottom edge of the phone, thumb on 1
  s += limb([[350, 200], [204, 168]], 44, CL.jack.top, 1.8);
  s += landline({ x: 156, y: 156, len: 110, rot: -35, thumb1: true, lw: 1.6 });
  // his outside (right) shoulder, very close and out of focus
  s += soft(ell(336, 26, 66, 56, CL.jack.top, INK, 2) + ell(298, -10, 40, 26, CL.jack.hood, INK, 2), 3);
  s += label(252, 112, 'right thumb on 1', 9) + ln(232, 116, 152, 146, INK, 1);
  s += label(212, 42, 'own phone recording', 9) + ln(170, 44, 152, 44, INK, 1);
  return s;
};

S.black = () => rect(-10, -10, 340, 200, '#000', 'none', 0) + txt(160, 96, 'CUT TO BLACK', 18, { fill: W, weight: 800, extra: 'letter-spacing="2"' });

/* Strip of 2-4 small 16:9 frames inside one 16:9 panel */
function strip(frames) {
  const n = frames.length, w = 156, h = 87.75;
  const pos = n === 2 ? [[2, 46], [162, 46]] : n === 3 ? [[2, 1.5], [162, 1.5], [82, 90.75]] : [[2, 1.5], [162, 1.5], [2, 90.75], [162, 90.75]];
  let s = rect(0, 0, 320, 180, W, 'none', 0);
  frames.forEach((fr, i) => {
    const [x, y] = pos[i];
    s += `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 320 180" overflow="hidden">${fr.svg}</svg>`;
    s += rect(x, y, w, h, 'none', INK, 0.8);
    s += rect(x, y, 15, 15, INK, 'none', 0) + txt(x + 7.5, y + 11.5, 'abcd'[i], 11, { fill: W, weight: 800 });
  });
  if (n === 2) s += txt(160, 94, '›', 18, { fill: INK }) + txt(160, 154, 'two moments in one shot', 9, { weight: 400, fill: G1 });
  return s;
}

function svgFrame(key, aria) {
  PF = 's' + key;
  const inner = S[key]();
  return `<svg class="frame" viewBox="0 0 320 180" role="img" aria-label="${aria}" font-family="${FONT}" stroke-linecap="round">${defs()}${inner}</svg>`;
}


/* ------------------------------------------------------------------ */
/* Shot list (sound lines quoted as written in the brief)               */
/* ------------------------------------------------------------------ */
const SECTIONS = [
  {
    title: "Nate's Living Room", shots: [
      { n: 1, name: 'Wide establishing — afternoon', dur: 8,
        action: 'Whole couch centred. Jack (left) and Nate (right, on the chaise) sunk into the cushions with controllers, looking up just over the lens. Kitchen arch behind; shuttered doors at frame right, sun coming in. Jack\'s phone small and lit on the left arm.',
        sound: 'Minecraft game sounds. The phone buzzes.',
        camera: 'Locked off in front of the fireplace, ~3 ft high.' },
      { n: 2, name: 'Close — the couch arm, afternoon', dur: 10,
        action: '(a) Phone large and sharp in the foreground: MOM CALLING. Jack soft behind it, turning to look; Nate farther back, softer, against the bright shutters. (b) Jack\'s hand presses the side button.',
        sound: 'Buzzing stops. The screen keeps glowing MOM.',
        camera: 'Low, just off the left end of the couch at arm height, looking along the couch.' },
      { n: 3, name: 'Wider, higher — time cuts', dur: 5,
        action: 'Same view, a little tighter each cut: (a) sun bright on the back wall; (b) boys slouched, feet up on the chaise; (c) cans and wrappers piled up, gold light; (d) blue dusk, room lit mostly by TV glow from below camera.',
        sound: 'Game sounds continue (nothing specified).',
        camera: 'Shot 1 position raised to ~5 ft, tilted slightly down. Tighter each cut.' },
      { n: 4, name: 'Medium two-shot — dusk', dur: 20,
        action: 'Both boys waist up, phone still visible on the arm at frame left. Jack staring down at the phone. Nate looks at the phone, then at Jack.',
        sound: 'Phone buzzes, Jack silences it without looking. Buzzes again, he silences it and keeps looking at it. Then a voicemail chime.',
        camera: 'Same as shot 3 at its tightest.' },
      { n: 5, name: 'Close — the couch arm, dusk', dur: 8,
        action: 'Identical framing to shot 2, darker. (a) Screen: MOM CALLING. (b) Screen: NEW VOICEMAIL — MOM; Jack\'s hand lifts the phone out of frame.',
        sound: '— (nothing specified)',
        camera: 'Exactly shot 2\'s setup.' },
      { n: 6, name: 'Close-up — Jack', dur: 25,
        action: 'Jack three-quarter on, phone to his LEFT ear (the far ear from camera). Eyes still aimed at the TV, expression going still.',
        sound: 'MOM (V.O.): "Hey, Jack. It\'s me. They\'re shutting the landline off tomorrow. I went to unplug the phone and the light was blinking. Nobody\'s checked that thing in a year. I pressed play to see what it was. It\'s Dad, Jack. It\'s from that week. But I turned it off. I didn\'t want to hear it without you. Can you come home? I love you."',
        camera: 'In front of the couch, right of centre, at his eye height. Slow push-in through the whole voicemail.' },
      { n: 7, name: 'Insert — the controller', dur: 3,
        action: 'Jack\'s free hand on the controller in his lap. His thumb has stopped moving.',
        sound: '— (nothing specified)',
        camera: 'Looking down at his lap. Static.' },
      { n: 8, name: 'Medium close-up — Nate', dur: 8,
        action: 'Nate lowering his controller, glancing toward Jack. Edge of Jack\'s shoulder at frame left; Jack stands up out of frame.',
        sound: 'NATE: "All good?" ... JACK: "Yeah." (stands) "I gotta go." NATE: "Wait, what?"',
        camera: 'Left of centre looking across at Nate; same size as shot 6.' },
      { n: 9, name: 'Nate in foreground — the exit', dur: 8,
        action: 'Nate\'s face fills the right half, sharp, looking back over his shoulder. Deep in the background, frame left, soft: Jack walks up the step and through the hall arch.',
        sound: 'A door SLAMS off screen. Then, over Nate\'s face, static and DAD (V.O.): "Hey, buddy."',
        camera: 'Close on Nate\'s right side. Static; focus stays on Nate.' },
    ],
  },
  {
    title: 'The Run', note: "Dad's voice plays over every shot, no other dialogue. Jack always moves LEFT TO RIGHT in side views.", shots: [
      { n: 10, name: 'Leading — up the driveway', dur: 6,
        action: 'Jack, full figure, walking fast straight toward us. Front door of Nate\'s house behind him.',
        sound: 'DAD (V.O.): "It\'s Dad. I\'m at the store."',
        camera: 'In the open trunk of a slow car, backing away up the driveway.' },
      { n: 11, name: 'Medium — side tracking', dur: 5,
        action: 'Jack in profile, head to knee, moving left to right, breaking from a jog into a run. Empty space in front of him.',
        sound: 'DAD (V.O.): "Your mom says we need milk, and I have absolutely no idea which kind you guys drink."',
        camera: 'Tracks alongside at his speed.' },
      { n: 12, name: 'Medium close-up — leading', dur: 4,
        action: 'Jack chest up, running at us, face set and certain, not sad. Streetlight above and behind him, light falling across his face.',
        sound: 'DAD (V.O.): "There\'s about forty of them."',
        camera: 'Leading: backs up ahead of him at his pace.' },
      { n: 13, name: 'Low angle — feet', dur: 2,
        action: 'Sneakers hitting the pavement, moving left to right.',
        sound: '— (Dad\'s message carries over; no new line)',
        camera: 'Near the ground. Static or tracking.' },
      { n: 14, name: 'Extreme wide — empty street', dur: 5,
        action: 'Straight down the centre of the road, streetlights receding both sides. Jack a tiny figure in the lower third, sprinting toward us down the middle.',
        sound: 'DAD (V.O.), laughing: "There\'s even one made out of oats."',
        camera: 'Locked off, symmetrical, centre of the road.' },
      { n: 15, name: 'Medium — Jack\'s front door, evening', dur: 4,
        action: 'Jack in profile arriving at the front door from frame left, out of breath. Knees to head.',
        sound: 'DAD (V.O.): "Okay, I\'m just gonna—"',
        camera: 'Static, side on to the door.' },
      { n: 16, name: 'Insert — door handle', dur: 2, flag: 'JUMP CUT, MID-WORD',
        action: 'Tight on the handle. His hand squeezing it. JUMP CUT, MID-WORD to shot 17.',
        sound: 'Dad\'s line is cut mid-word by the jump cut.',
        camera: 'Tight insert. Static.' },
    ],
  },
  {
    title: "Jack's Living Room", note: "Dad's voice is now thin and tinny, from the landline.", shots: [
      { n: 17, name: 'Tight two-shot — front on', dur: 8,
        action: 'Jack (left) and Mom (right) chest up, shoulder to shoulder, filling the frame. Jack holds the cordless landline at chest height between them (bottom of frame). Out of breath, hoodie on, a small laugh, wiping his eyes.',
        sound: 'DAD (V.O.): "—get the blue one. If that\'s wrong, that\'s on you guys."',
        camera: 'Front on, static.' },
      { n: 18, name: 'Close-up — Jack', dur: 5, flag: 'SAFETY',
        action: 'Looking across at Jack from Mom\'s side. His smile fading.',
        sound: 'DAD (V.O.): "Anyway. Call me back when you get this."',
        camera: 'From Mom\'s side (frame right). SAFETY shot.' },
      { n: 19, name: 'Close-up — Mom', dur: 5,
        action: 'Looking across at Mom from Jack\'s side. She is looking at Jack, not the phone: proud and devastated at once.',
        sound: 'DAD (V.O.): "Love you, bud." Then a CLICK.',
        camera: 'From Jack\'s side (frame left).' },
      { n: 20, name: 'Wide two-shot', dur: 5,
        action: 'Jack left, Mom right, side by side, small in the room. Jack looks up from the phone. Mirrors shot 1.',
        sound: 'Silence.',
        camera: '~3 ft, straight on, couch centred. Match shot 1.' },
      { n: 21, name: 'Over their shoulders — the phone', dur: 5,
        action: 'Between their heads, looking down at the handset in Jack\'s hands. Their shoulders frame the edges, out of focus. Neither moves. From behind, Jack is on frame RIGHT, Mom on frame LEFT.',
        sound: 'AUTOMATED VOICE (V.O.): "End of message. To delete this message, press seven. To save it, press nine..." (we cut away halfway through)',
        camera: 'Behind the couch, between their heads, angled down. Reverse angle.' },
      { n: 22, name: 'Medium two-shot — the look', dur: 12,
        action: '(a) Jack looks at Mom. (b) Her arm goes around his shoulders. (c) He has his own phone out in his left hand, red recording dot, lifting both phones in front of him.',
        sound: 'AUTOMATED VOICE (V.O.) continues: "...To hear it again, press one." His phone chimes as it starts recording.',
        camera: 'Front on, knees to tops of heads. Static.' },
      { n: 23, name: 'Close — the two phones', dur: 6,
        action: 'His own phone in his left hand, screen up, red recording timer. Landline in his right hand, pressed against the bottom edge of his phone. Right thumb on the 1 key.',
        sound: 'BEEP. DAD (V.O.): "Hey, buddy—" then CUT TO BLACK.',
        camera: 'High angle from just over Jack\'s outside (right) shoulder, looking down at his hands as he sees them.' },
      { n: 'black', name: 'Cut to black', dur: 0, end: true,
        action: 'End.', sound: '—', camera: '—' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const allShots = SECTIONS.flatMap((s) => s.shots).filter((s) => !s.end);
const totalSec = allShots.reduce((a, s) => a + s.dur, 0);
const mmss = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;

function card(sh) {
  const title = sh.end ? 'CUT TO BLACK' : `${sh.n}. ${esc(sh.name)}`;
  const dur = sh.end ? '' : `<span class="dur">~${sh.dur}s</span>`;
  const flag = sh.flag ? `<span class="flag">${esc(sh.flag)}</span>` : '';
  const svg = svgFrame(sh.n, `Shot ${sh.n}: ${esc(sh.name)}`);
  const body = sh.end ? '' : `<dl>
<div><dt>ACTION</dt><dd>${esc(sh.action)}</dd></div>
<div><dt>SOUND</dt><dd>${esc(sh.sound)}</dd></div>
<div><dt>CAMERA</dt><dd>${esc(sh.camera)}</dd></div>
</dl>`;
  return `<article class="card${sh.end ? ' end' : ''}"><header><h3>${title}</h3>${flag}${dur}</header>${svg}${body}</article>`;
}

function legendSvg() {
  PF = 'lg';
  return `<svg class="legend-svg" viewBox="0 0 660 46" font-family="${FONT}">${defs()}
${subj([[8, 14], [62, 14]])}${txt(74, 18, 'Subject movement (solid line, filled head)', 11, { anchor: 'start', weight: 600 })}
${cam([[350, 14], [404, 14]])}${txt(416, 18, 'Camera movement (dashed line, open head)', 11, { anchor: 'start', weight: 600 })}
<circle cx="35" cy="36" r="5" fill="${RED}"/>${txt(74, 40, 'Red dot = phone recording (shots 22, 23)', 11, { anchor: 'start', weight: 600 })}
<g filter="url(#lg-soft)" opacity="0.6"><rect x="356" y="30" width="44" height="12" rx="3" fill="${G1}"/></g>${txt(416, 40, 'Pale and blurred = soft / out of focus', 11, { anchor: 'start', weight: 600 })}
</svg>`;
}

function castSvg() {
  PF = 'cast';
  const bust = (who, x, extra = {}) => person({ who, x, y: 32, u: 17, tl: 1.5, hips: false, gaze: [0, 0], ...extra });
  const cap = (x, a, b) => txt(x, 104, a, 11.5) + txt(x, 117, b, 10, { weight: 400 });
  return `<svg class="cast-svg" viewBox="0 0 480 122" font-family="${FONT}">${defs()}
${bust('jack', 80)}${bust('nate', 240)}${bust('mom', 400, { expr: 'neutral' })}
${cap(80, 'JACK, 17', 'dark hoodie, hood down')}${cap(240, 'NATE, 17', 'light tee, curly hair')}${cap(400, 'MOM, 40s', 'shoulder-length hair, cardigan')}
</svg>`;
}

function flowThumbs() {
  return SECTIONS.flatMap((sec) => sec.shots).map((sh) => {
    PF = 't' + sh.n;
    const svg = `<svg viewBox="0 0 320 180" font-family="${FONT}" aria-hidden="true">${defs()}${S[sh.n]()}</svg>`;
    return `<figure>${svg}<figcaption>${sh.end ? 'END' : `<b>${sh.n}</b> ${sh.dur}s`}</figcaption></figure>`;
  }).join('');
}

function page(inner, n, total, cls = '') {
  return `<section class="page ${cls}">${inner}<footer class="pfoot"><span>CALL ME BACK — Storyboard</span><span>Page ${n} of ${total}</span></footer></section>`;
}

function build() {
  // paginate: 6 cards per printed page, every section starts a new page
  const pages = [];
  for (const sec of SECTIONS) {
    for (let i = 0; i < sec.shots.length; i += 6) pages.push({ sec, shots: sec.shots.slice(i, i + 6), first: i === 0 });
  }
  const total = pages.length + 1;
  const secRange = (sec) => {
    const ns = sec.shots.filter((s) => !s.end);
    return `Shots ${ns[0].n}–${ns[ns.length - 1].n} · ~${mmss(ns.reduce((a, s) => a + s.dur, 0))}`;
  };
  const cover = `
<header class="titleblock">
  <div>
    <h1>CALL ME BACK</h1>
    <p class="kind">Storyboard</p>
  </div>
  <dl class="meta">
    <div><dt>Director</dt><dd class="fillin"></dd></div>
    <div><dt>Shots</dt><dd>23</dd></div>
    <div><dt>Est. running time</dt><dd>${mmss(totalSec)} <small>(${totalSec} s, summed from shot durations)</small></dd></div>
  </dl>
</header>
<div class="legend"><h2 class="mini">Legend</h2>${legendSvg()}</div>
<div class="cast"><h2 class="mini">Who is who</h2>${castSvg()}<p class="castnote">Dad is never seen; he is only a voice.</p></div>
<ol class="toc">${SECTIONS.map((s) => `<li><b>${esc(s.title)}</b> <span>${secRange(s)}</span></li>`).join('')}</ol>
<div class="flow"><h2 class="mini">The whole film in order</h2><div class="flowgrid">${flowThumbs()}</div></div>
<p class="idea">The camera is wide and still while Jack avoids the phone, moves once he runs, and ends close on him and his mom. Shot 20 mirrors shot 1: two people side by side on a couch, but the person next to him has changed.</p>`;
  let html = page(cover, 1, total, 'cover');
  pages.forEach((pg, i) => {
    const h = pg.first
      ? `<h2 class="section">${esc(pg.sec.title)} <span>${secRange(pg.sec)}</span></h2>${pg.sec.note ? `<p class="secnote">${esc(pg.sec.note)}</p>` : ''}`
      : `<h2 class="section cont">${esc(pg.sec.title)} <span>continued</span></h2>`;
    html += page(`${h}<div class="grid">${pg.shots.map(card).join('\n')}</div>`, i + 2, total, pg.first ? 'first' : 'more');
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Call Me Back Storyboard</title>
<!-- Generated by storyboard-gen.js — edit the generator, then run: node storyboard-gen.js -->
<style>
:root { --ink:#1b1b1b; --muted:#555; --rule:#d0d0d0; --red:${RED}; }
* { box-sizing: border-box; }
html { background:#fff; }
body { margin:0; padding:24px 16px 48px; background:#fff; color:var(--ink); font:14px/1.4 ${FONT}; }
.page { max-width:1400px; margin:0 auto; }
.titleblock { display:flex; flex-wrap:wrap; gap:16px 48px; align-items:flex-end; justify-content:space-between; border-bottom:3px solid var(--ink); padding-bottom:12px; }
h1 { font-size:44px; letter-spacing:.06em; margin:0; line-height:1; }
.kind { margin:4px 0 0; font-size:18px; text-transform:uppercase; letter-spacing:.2em; color:var(--muted); }
.meta { margin:0; display:grid; gap:4px; min-width:300px; }
.meta div { display:flex; gap:10px; align-items:baseline; }
.meta dt { font-weight:700; text-transform:uppercase; font-size:11px; letter-spacing:.08em; width:130px; flex:none; }
.meta dd { margin:0; }
.meta small { color:var(--muted); }
.fillin { flex:1; border-bottom:1.5px solid var(--ink); min-width:200px; height:1.2em; }
h2.mini { font-size:11px; text-transform:uppercase; letter-spacing:.1em; margin:0 0 4px; }
.legend { margin:14px 0 0; }
.legend-svg { width:100%; max-width:620px; height:auto; display:block; }
.cast { margin:14px 0 0; }
.cast-svg { width:100%; max-width:520px; height:auto; display:block; }
.castnote { margin:2px 0 0; font-size:12px; color:var(--muted); }
@media print { .castnote { font-size:9.5px; } .toc { font-size:10px; } }
.toc { margin:16px 0 0; padding-left:20px; }
.toc span { color:var(--muted); margin-left:6px; }
.idea { max-width:820px; color:var(--muted); font-size:13px; }
.flow { margin-top:18px; }
.flowgrid { display:grid; grid-template-columns:repeat(8, minmax(0,1fr)); gap:6px; }
@media screen and (max-width:900px) { .flowgrid { grid-template-columns:repeat(4, minmax(0,1fr)); } }
.flowgrid figure { margin:0; }
.flowgrid figure > svg { display:block; width:100%; height:auto; border:1px solid var(--ink); }
.flowgrid figcaption { font-size:11px; margin-top:1px; }
h2.section { font-size:22px; margin:36px 0 4px; padding-top:10px; border-top:3px solid var(--ink); text-transform:uppercase; letter-spacing:.05em; }
h2.section span { font-size:13px; font-weight:400; color:var(--muted); text-transform:none; letter-spacing:0; margin-left:8px; }
h2.section.cont { display:none; }
.secnote { margin:0 0 10px; color:var(--muted); font-size:13px; }
.grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:16px; margin-top:12px; }
.page.more .grid { margin-top:16px; }
@media (max-width:1050px) { .grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
@media (max-width:640px) { .grid { grid-template-columns:minmax(0,1fr); } h1 { font-size:34px; } }
.card { border:1px solid var(--rule); padding:8px 10px 10px; break-inside:avoid; page-break-inside:avoid; background:#fff; }
.card header { display:flex; align-items:baseline; gap:8px; margin-bottom:6px; }
.card h3 { margin:0; font-size:14px; font-weight:800; flex:1; line-height:1.2; }
.dur { font-size:12px; font-weight:700; border:1.5px solid var(--ink); border-radius:3px; padding:0 5px; white-space:nowrap; }
.flag { font-size:10px; font-weight:800; background:var(--ink); color:#fff; padding:1px 5px; border-radius:2px; white-space:nowrap; letter-spacing:.04em; }
svg.frame { display:block; width:100%; height:auto; aspect-ratio:16/9; border:1px solid var(--ink); background:#fff; }
.card dl { margin:7px 0 0; font-size:12px; line-height:1.35; }
.card dl div { display:grid; grid-template-columns:54px 1fr; gap:6px; margin-top:3px; }
.card dt { font-weight:800; font-size:10px; letter-spacing:.06em; padding-top:1px; }
.card dd { margin:0; }
.card.end svg.frame { max-width:60%; margin:0 auto; }
.pfoot { display:none; }
@page { size: letter landscape; margin: 0.35in; }
@media print {
  body { padding:0; font-size:10px; }
  .page { max-width:none; height:7.72in; display:flex; flex-direction:column; overflow:hidden; }
  .page + .page { break-before:page; page-break-before:always; }
  h1 { font-size:40px; }
  h2.section { margin:0 0 2px; padding-top:4px; font-size:15px; border-top-width:2px; }
  h2.section span { font-size:10px; }
  h2.section.cont { display:block; }
  .secnote { font-size:9.5px; margin:0 0 2px; }
  .grid { grid-template-columns:repeat(3, minmax(0,1fr)); grid-auto-rows:min-content; gap:0.1in 0.14in; margin-top:4px !important; }
  .card { padding:4px 6px 5px; }
  .card header { margin-bottom:3px; }
  .card h3 { font-size:10.5px; }
  .dur { font-size:9px; padding:0 4px; }
  .flag { font-size:8px; }
  .card dl { font-size:7.6px; line-height:1.27; margin-top:4px; }
  .card dl div { grid-template-columns:40px 1fr; margin-top:1.5px; gap:4px; }
  .card dt { font-size:7px; }
  .cover .legend, .cover .cast { margin-top:10px; }
  .cover .toc { margin-top:8px; }
  .cover .idea { font-size:10px; margin:8px 0 0; }
  .flow { margin-top:10px; }
  .flowgrid { gap:4px; }
  .flowgrid figcaption { font-size:8px; }
  .legend-svg { max-width:5.6in; } .cast-svg { max-width:3.6in; }
  .pfoot { display:flex; justify-content:space-between; margin-top:auto; padding-top:4px; border-top:1px solid var(--rule); font-size:9px; color:var(--muted); }
}
</style>
</head>
<body>
${html}
</body>
</html>
`;
}

if (require.main === module) {
  const out = path.join(__dirname, 'storyboard.html');
  fs.writeFileSync(out, build());
  console.log(`wrote ${out} · ${allShots.length} shots · ${mmss(totalSec)}`);
}
