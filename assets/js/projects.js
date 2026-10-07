// Projects for the hero reel and the Selected Work grid. Order here = order on the site.
//   title, kind  — shown on the reel, cards and player. `kind` also creates the filter chips.
//   client       — optional; who it was for, shown with the kind (e.g. "Carlsbad High Football").
//   year, length — optional; left blank they're simply hidden.
//   youtube      — the video ID from the link (the part after "v=", "youtu.be/" or "shorts/").
//   vertical     — true for Shorts / 9:16 videos (shown in a phone-shaped frame and a tall player).
//   poster       — optional still image instead of the YouTube thumbnail.
//   preview      — optional short silent .mp4 loop that plays when someone hovers the card.
//   tint         — two colours for the backdrop while the thumbnail loads.
window.PROJECTS = [
  { title: 'Back in Black', client: 'Carlsbad High Football', kind: 'Hype edit', year: '', length: '', youtube: 'XrILXU8Qkow', vertical: false, poster: '', preview: '', tint: ['#2a2a2a', '#070707'] },
  { title: 'Drone Sample', client: '', kind: 'Drone', year: '', length: '', youtube: 'msb17SudMss', vertical: false, poster: '', preview: '', tint: ['#23313a', '#090909'] },
];

// "Carlsbad High Football · Hype edit · 2026 · 0:42" with any blank parts left out.
window.projectMeta = (p, parts = ['client', 'kind', 'year', 'length']) => parts.map(k => p[k]).filter(Boolean).join(' · ');
