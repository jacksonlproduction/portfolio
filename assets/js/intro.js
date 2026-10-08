// Signature intro: "JL" writes itself in the hero, the slogan rises beneath it, then the mark glides
// into the nav logo and the hero headline comes up. Plays once per visit; any scroll, click or key skips it.
// The decision to play is made by the tiny inline script at the top of <body> (it adds html.intro-on).
(() => {
  const root = document.documentElement;
  const hero = document.querySelector('.hero');
  const logo = document.querySelector('.nav-logo');
  if (!root.classList.contains('intro-on') || !hero || !logo) { root.classList.remove('intro-on'); return; }
  try { sessionStorage.setItem('jl-intro', '1'); } catch (e) {}

  // Aston Script "J" and "L" outlines (font units, y up) and the pen paths that reveal them.
  const GLYPHS = [[0, "M2071 1054Q2071 1045 2060.0 1035.0Q2049 1025 2034.5 1016.0Q2020 1007 2005.0 1000.0Q1990 993 1982 990Q1959 979 1934.0 970.0Q1909 961 1886 952Q1863 944 1840 934L1841 935Q1776 882 1711.5 807.0Q1647 732 1584.5 644.0Q1522 556 1464.0 461.0Q1406 366 1354 274Q1336 242 1319.0 209.5Q1302 177 1285 143Q1366 54 1404.0 -54.0Q1442 -162 1442 -277V-286H1428Q1428 -174 1390.0 -67.0Q1352 40 1277 126L1244 59H1245Q1191 -75 1118.0 -196.0Q1045 -317 947.0 -409.5Q849 -502 723.0 -556.5Q597 -611 436 -611Q373 -611 313.0 -600.0Q253 -589 194 -557Q143 -529 106.0 -490.0Q69 -451 44.0 -404.0Q19 -357 7.0 -304.5Q-5 -252 -5 -196Q-5 -44 89 89Q140 162 209.0 214.0Q278 266 358.0 299.5Q438 333 526.0 349.0Q614 365 703 365Q744 365 783.0 362.5Q822 360 860 354Q883 391 915 431Q966 494 1026.5 547.0Q1087 600 1153.0 645.0Q1219 690 1289.5 728.0Q1360 766 1432 798Q1505 830 1581.0 859.0Q1657 888 1731 915L1830 951L1829 950Q1867 982 1897.0 1002.0Q1927 1022 1962 1038V1037Q1966 1039 1977.0 1044.0Q1988 1049 2001.5 1054.5Q2015 1060 2029.0 1064.0Q2043 1068 2052 1068Q2071 1068 2071 1054ZM982 -201Q1019 -152 1056.0 -96.5Q1093 -41 1131 19L1169 78L1230 173Q1181 216 1123.5 248.0Q1066 280 994 303Q968 311 943.0 317.0Q918 323 892 328Q862 284 838 229Q821 190 812.0 148.5Q803 107 803 68Q803 42 804.5 15.5Q806 -11 815 -41L801 -42Q782 16 782 79Q782 119 789.0 160.5Q796 202 809 241Q817 264 827.0 288.0Q837 312 849 334Q796 340 742 340Q657 340 571.0 321.0Q485 302 405.0 266.0Q325 230 255.0 177.5Q185 125 133 58Q89 -4 60.0 -78.0Q31 -152 31 -233Q31 -330 72.0 -411.0Q113 -492 203 -541Q252 -567 305.0 -578.5Q358 -590 415 -590Q508 -590 588.0 -557.0Q668 -524 737.5 -469.0Q807 -414 867.5 -344.5Q928 -275 982 -201ZM1000 321Q1072 298 1131.5 265.0Q1191 232 1241 187Q1303 285 1367.0 384.0Q1431 483 1498.5 576.0Q1566 669 1637.0 754.0Q1708 839 1783 908Q1742 888 1701.5 869.5Q1661 851 1619 832Q1577 813 1535.5 794.0Q1494 775 1452 755Q1381 720 1314.5 682.0Q1248 644 1185.0 601.0Q1122 558 1063.5 509.0Q1005 460 950 403Q937 388 926.5 374.5Q916 361 905 346Q931 341 955.0 334.5Q979 328 1001 321Z"], [1667, "M1764 1137Q1818 1137 1847.0 1111.0Q1876 1085 1876 1039Q1876 989 1839.5 922.0Q1803 855 1725 777Q1702 754 1673.0 729.0Q1644 704 1611.5 679.0Q1579 654 1545.0 630.0Q1511 606 1478 585Q1428 553 1373.0 523.5Q1318 494 1261.5 468.0Q1205 442 1148.0 420.5Q1091 399 1036 383Q1031 375 1026.0 366.0Q1021 357 1017 349Q983 287 950.5 233.0Q918 179 880 133Q842 88 794.0 49.0Q746 10 680 -19H681Q726 -51 776.5 -85.0Q827 -119 882.0 -148.0Q937 -177 995.5 -195.5Q1054 -214 1113 -214Q1180 -214 1242.5 -185.0Q1305 -156 1366 -113L1373 -120Q1347 -152 1318.0 -181.5Q1289 -211 1255.5 -233.0Q1222 -255 1184.0 -268.0Q1146 -281 1102 -281Q1051 -281 1005.0 -265.5Q959 -250 916.0 -225.0Q873 -200 832.5 -167.5Q792 -135 752 -102Q729 -83 706.0 -63.5Q683 -44 660 -27Q622 -43 577.5 -56.0Q533 -69 486.5 -78.0Q440 -87 393.0 -92.0Q346 -97 303 -97Q234 -97 177.0 -83.0Q120 -69 79.5 -46.5Q39 -24 17.0 4.0Q-5 32 -5 60Q-5 81 8.0 101.5Q21 122 49.5 137.5Q78 153 122.5 163.0Q167 173 230 173Q279 173 326.0 163.0Q373 153 417.0 136.0Q461 119 503.0 96.0Q545 73 585 47L613 29Q656 64 697.5 106.0Q739 148 777 194Q808 230 836.0 268.0Q864 306 891 342L900 354Q825 342 744 342Q693 342 641.0 349.0Q589 356 541.0 371.5Q493 387 450.5 411.0Q408 435 375 469Q339 508 321.0 553.5Q303 599 303 657Q303 726 332.0 792.5Q361 859 409 913Q445 953 490.0 985.5Q535 1018 586.0 1040.5Q637 1063 693.0 1075.0Q749 1087 806 1087Q847 1087 885.5 1082.5Q924 1078 967 1067L965 1057Q917 1063 876 1063Q818 1063 760.0 1051.5Q702 1040 647.0 1016.5Q592 993 543.0 958.0Q494 923 454 875Q415 828 388.5 771.5Q362 715 362 649Q362 567 413 501Q444 463 484.5 437.0Q525 411 572.0 394.5Q619 378 669.5 370.5Q720 363 770 363Q808 363 844.5 366.5Q881 370 916 376L953 428Q978 462 1007.0 502.0Q1036 542 1067.5 584.5Q1099 627 1132.5 670.0Q1166 713 1201 754Q1231 790 1270.5 832.0Q1310 874 1355.5 916.5Q1401 959 1451.5 999.0Q1502 1039 1554.5 1069.5Q1607 1100 1660.0 1118.5Q1713 1137 1764 1137ZM1711 791Q1786 866 1821.5 930.0Q1857 994 1857 1039Q1857 1077 1833.5 1098.0Q1810 1119 1765 1119Q1716 1119 1665.5 1099.5Q1615 1080 1565.5 1048.5Q1516 1017 1469.0 975.5Q1422 934 1380.0 890.0Q1338 846 1302.5 802.0Q1267 758 1241 722Q1176 632 1127.5 549.5Q1079 467 1048 407Q1157 439 1263.0 488.5Q1369 538 1467 600Q1517 632 1583.0 681.0Q1649 730 1711 791ZM305 -79Q387 -79 459.0 -56.0Q531 -33 597 17L575 31Q538 54 496.0 76.0Q454 98 410.0 114.5Q366 131 320.5 141.5Q275 152 230 152Q186 152 153.0 144.0Q120 136 98.0 122.5Q76 109 65.0 91.0Q54 73 54 54Q54 30 69.0 6.5Q84 -17 114.5 -36.0Q145 -55 192.5 -67.0Q240 -79 305 -79Z"]];
  const PEN = {"J": "M804 -30 C802 -15 792 22 793 60 C794 98 796 153 810 200 C824 247 852 298 880 340 C908 382 938 408 980 450 C1022 492 1073 548 1130 590 C1187 632 1248 663 1320 700 C1392 737 1480 777 1560 810 C1640 843 1730 868 1800 900 C1870 932 1937 974 1980 1000 C2023 1026 2058 1055 2058 1055 C2058 1055 2018 1021 1980 1000 C1942 979 1893 980 1830 930 C1767 880 1672 785 1600 700 C1528 615 1454 507 1400 420 C1346 333 1320 263 1275 180 C1230 97 1180 2 1130 -80 C1080 -162 1029 -245 975 -310 C921 -375 868 -432 805 -470 C742 -508 668 -520 600 -540 C532 -560 473 -590 400 -590 C327 -590 222 -578 160 -540 C98 -502 53 -427 30 -360 C7 -293 5 -210 20 -140 C35 -70 70 -3 120 60 C170 123 247 193 320 240 C393 287 490 321 560 340 C630 359 667 359 740 356 C813 353 923 344 1000 320 C1077 296 1147 250 1200 210 C1253 170 1287 128 1320 80 C1353 32 1381 -20 1400 -80 C1419 -140 1430 -247 1436 -280", "L": "M2630 1064 C2605 1067 2552 1091 2480 1084 C2408 1077 2277 1061 2200 1020 C2123 979 2057 900 2020 840 C1983 780 1973 717 1976 660 C1979 603 2003 543 2040 500 C2077 457 2140 425 2200 400 C2260 375 2337 355 2400 350 C2463 345 2530 363 2580 370 C2630 377 2630 365 2700 390 C2770 415 2900 462 3000 520 C3100 578 3220 667 3300 740 C3380 813 3443 903 3480 960 C3517 1017 3530 1052 3520 1080 C3510 1108 3473 1133 3420 1130 C3367 1127 3270 1098 3200 1060 C3130 1022 3067 967 3000 900 C2933 833 2852 737 2800 660 C2748 583 2730 516 2685 440 C2640 364 2586 275 2530 205 C2474 135 2422 64 2350 20 C2278 -24 2175 -40 2100 -58 C2025 -76 1963 -91 1900 -88 C1837 -85 1758 -65 1720 -40 C1682 -15 1667 30 1670 60 C1673 90 1702 123 1740 140 C1778 157 1840 167 1900 164 C1960 161 2030 151 2100 120 C2170 89 2253 30 2320 -20 C2387 -70 2437 -137 2500 -178 C2563 -219 2650 -253 2700 -268 C2750 -283 2760 -278 2800 -270 C2840 -262 2901 -245 2940 -220 C2979 -195 3018 -137 3034 -120"};
  const ASC = 1475, DESC = 700, ADV = 3046;   // em box: the same box the nav logo's text sits in
  const NS = 'http://www.w3.org/2000/svg';
  const el = (n, a = {}) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); return e; };

  const wrap = document.createElement('div');
  wrap.className = 'intro';
  wrap.setAttribute('aria-hidden', 'true');
  const svg = el('svg', { class: 'intro-mark', viewBox: `0 ${-ASC} ${ADV} ${ASC + DESC}` });
  const defs = el('defs');
  const mask = el('mask', { id: 'intro-pen', maskUnits: 'userSpaceOnUse', x: -600, y: -2000, width: ADV + 1400, height: 3200 });
  const flip = () => el('g', { transform: 'scale(1,-1)' });
  const mg = el('g');   // mask content already lives in the masked group's (flipped) space
  const pens = ['J', 'L'].map(k => {
    const p = el('path', { d: PEN[k], fill: 'none', stroke: '#fff', 'stroke-width': 135, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    mg.append(p);
    return p;
  });
  mask.append(mg); defs.append(mask); svg.append(defs);
  const ink = flip();
  ink.setAttribute('mask', 'url(#intro-pen)');
  ink.setAttribute('class', 'intro-ink');
  GLYPHS.forEach(([x, d]) => ink.append(el('path', { d, transform: `translate(${x} 0)` })));
  const tipG = flip();
  const tip = el('circle', { r: 46, class: 'intro-tip' });
  tipG.append(tip);
  svg.append(ink, tipG);

  const slogan = document.createElement('p');
  slogan.className = 'intro-slogan';
  [...'Every frame, on purpose.'].forEach((ch, i) => {
    const s = document.createElement('span');
    s.textContent = ch;
    s.style.setProperty('--i', i);
    slogan.append(s);
  });
  wrap.append(svg, slogan);
  hero.append(wrap);

  // timeline (ms)
  const STROKES = [{ p: pens[0], from: 250, to: 1350 }, { p: pens[1], from: 1250, to: 2150 }];
  const SLOGAN_AT = 2050, FLY_AT = 3500, FLY_MS = 900;
  const lens = pens.map(p => p.getTotalLength());
  pens.forEach((p, i) => { p.style.strokeDasharray = lens[i]; p.style.strokeDashoffset = lens[i]; });
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // The clock advances at most 34ms per frame, so a slow first frame (the reel is still loading)
  // slows the writing down instead of skipping it. A wall-clock cap ends the intro regardless.
  let t = -120, last = 0, raf = 0, done = false, flying = false, sloganOn = false;
  const startedAt = performance.now();
  clearTimeout(window.__introSafety);
  function frame(now) {
    t += last ? Math.min(now - last, 34) : 0;
    last = now;
    if (now - startedAt > 7000 && !flying) { skip(); return; }
    let tipAt = null;
    STROKES.forEach((s, i) => {
      const k = Math.min(1, Math.max(0, (t - s.from) / (s.to - s.from)));
      const e = ease(k);
      s.p.style.strokeDashoffset = lens[i] * (1 - e);
      if (k > 0 && k < 1) tipAt = s.p.getPointAtLength(lens[i] * e);
    });
    if (tipAt) { tip.setAttribute('cx', tipAt.x); tip.setAttribute('cy', tipAt.y); tip.classList.add('on'); }
    else tip.classList.remove('on');
    if (!sloganOn && t >= SLOGAN_AT) { sloganOn = true; wrap.classList.add('slogan-in'); }
    if (!flying && t >= FLY_AT) fly();
    if (!done) raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  let revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    root.classList.remove('intro-on');
    dispatchEvent(new Event('intro:done'));
  }

  // glide the written mark onto the nav logo (same font, same em box), then hand over to the real logo
  function fly() {
    flying = true;
    wrap.classList.add('leaving');
    const a = svg.getBoundingClientRect();
    const r = document.createRange();
    r.selectNodeContents(logo);
    const b = r.getBoundingClientRect();
    const s = b.width / a.width;
    const anim = svg.animate(
      [{ transform: 'none' }, { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${s})` }],
      { duration: FLY_MS, easing: 'cubic-bezier(.7, 0, .2, 1)', fill: 'forwards' }
    );
    setTimeout(reveal, FLY_MS * 0.45);
    anim.onfinish = finish;
  }

  function finish() {
    if (done) return;
    done = true;
    cancelAnimationFrame(raf);
    removeEventListener('wheel', skip); removeEventListener('touchstart', skip);
    removeEventListener('keydown', skip); removeEventListener('pointerdown', skip);
    root.classList.remove('intro-on');
    wrap.remove();
    reveal();
  }

  // any interaction skips straight to the site
  function skip() {
    if (done) return;
    wrap.classList.add('skipped');
    if (!flying) { flying = true; reveal(); }
    setTimeout(finish, 280);
  }
  addEventListener('wheel', skip, { passive: true });
  addEventListener('touchstart', skip, { passive: true });
  addEventListener('keydown', skip);
  addEventListener('pointerdown', skip);
})();
