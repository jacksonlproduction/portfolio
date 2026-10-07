// Projects for the hero reel and the Selected Work grid. Order here = order on the site.
//   title, kind  — shown on the reel, cards and player. `kind` also creates the filter chips.
//   year, length — optional; left blank they're simply hidden.
//   youtube      — the video ID from the link (the part after "v=", "youtu.be/" or "shorts/").
//   vertical     — true for Shorts / 9:16 videos (shown in a phone-shaped frame and a tall player).
//   poster       — optional still image instead of the YouTube thumbnail.
//   preview      — optional short silent .mp4 loop that plays when someone hovers the card.
//   tint         — two colours for the backdrop while the thumbnail loads.
window.PROJECTS = [
  { title: 'Football Hype Edit 01', kind: 'Hype edit', year: '', length: '', youtube: '-UdcmGmRcQQ', vertical: true, poster: '', preview: '', tint: ['#5a0d1c', '#0c0c0c'] },
  { title: 'Kids for Peace',        kind: 'Feature',   year: '', length: '', youtube: 'SAqlqdt-icU', vertical: false, poster: '', preview: '', tint: ['#23313a', '#090909'] },
  { title: 'Football Hype Edit 02', kind: 'Hype edit', year: '', length: '', youtube: 'G7nmSxmj0BA', vertical: true, poster: '', preview: '', tint: ['#6b1022', '#120708'] },
];

// "Hype edit · 2026 · 0:42" with any blank parts left out.
window.projectMeta = (p, parts = ['kind', 'year', 'length']) => parts.map(k => p[k]).filter(Boolean).join(' · ');
