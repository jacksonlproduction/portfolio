// Projects for the hero reel and the Selected Work grid. Order here = order on the site.
//   title, kind  — shown on the reel, cards and player. `kind` also creates the filter chips.
//   client       — optional; who it was for, shown with the kind (e.g. "Carlsbad High Football").
//   year, length — optional; left blank they're simply hidden.
//   featured     — true to show it as a full-width card with its stat badge (keep these at the top of the list).
//   stat         — optional proof point, e.g. '160K views on TikTok' (badge on the card, reel and player).
//   blurb        — optional one-line pitch shown under the title in the player.
//   youtube      — the video ID from the link (the part after "v=", "youtu.be/" or "shorts/").
//   vertical     — true for Shorts / 9:16 videos (shown in a phone-shaped frame and a tall player).
//   poster       — optional still image instead of the YouTube thumbnail.
//   preview      — optional short silent .mp4 loop that plays when someone hovers the card.
//   tint         — two colours for the backdrop while the thumbnail loads.
window.PROJECTS = [
  { title: 'Wales', client: '', kind: 'Travel edit', featured: true, stat: '160K views on TikTok', blurb: 'A travel edit from a trip across Wales that took off on TikTok, passing 160,000 views.', year: '', length: '', youtube: 'ZgR1h7l1MBs', vertical: false, poster: '', preview: '', tint: ['#1f2d26', '#070908'] },
  { title: 'Blueface, Live in San Diego', client: '', kind: 'Event', featured: true, stat: 'Worked with Blueface', blurb: 'Filmed rapper Blueface performing at an intimate party in San Diego: up-close, high-energy coverage that puts you right in the room.', year: '', length: '', youtube: '6BGbgoKNAbc', vertical: true, poster: '', preview: '', tint: ['#13233f', '#06080d'] },
  { title: 'Back in Black', client: 'Carlsbad High Football', kind: 'Hype edit', year: '', length: '', youtube: 'XrILXU8Qkow', vertical: false, poster: '', preview: '', tint: ['#2a2a2a', '#070707'] },
  { title: 'Drone Sample', client: '', kind: 'Drone', year: '', length: '', youtube: 'msb17SudMss', vertical: false, poster: '', preview: '', tint: ['#23313a', '#090909'] },
  { title: 'Football Hype Edit', client: '', kind: 'Hype edit', year: '', length: '', youtube: 'Gl8d3AwS854', vertical: false, poster: '', preview: '', tint: ['#5a0d1c', '#0c0c0c'] },
  { title: 'Push', client: '', kind: 'Feature', blurb: 'A cinematic feature story following two skateboarders: the grind, the style and what keeps them coming back to the board.', year: '', length: '', youtube: 'JRt7GK9okqE', vertical: false, poster: '', preview: '', tint: ['#3a3226', '#0b0a08'] },
  { title: 'Devin', client: 'Carlsbad High', kind: 'Short doc', blurb: 'A short documentary on Devin Adams, a Carlsbad High student with special needs, and the people and moments that make up his world.', year: '', length: '', youtube: 'ovH4jUSC23k', vertical: false, poster: '', preview: '', tint: ['#23313a', '#090909'] },
  { title: 'Homecoming Promo', client: '', kind: 'Social', blurb: 'A social-first promo built to sell out the homecoming dance: punchy, playful and made to stop the scroll.', year: '', length: '', youtube: '7x4kH1jXUXg', vertical: true, poster: '', preview: '', tint: ['#4a1530', '#0c0709'] },
  { title: 'Listing Walkthrough', client: 'Real estate', kind: 'Social', blurb: 'A captioned, social-first property tour built to stop the scroll and get buyers through the door.', year: '', length: '', youtube: '1xtXpjTS-Ak', vertical: true, poster: '', preview: '', tint: ['#3a3226', '#0b0a08'] },
  { title: 'Catalina', client: '', kind: 'Travel edit', blurb: 'A travel edit from Catalina Island: crystal water, island light and a rhythm cut to feel like summer.', year: '', length: '', youtube: 'DMY4zkKNZlc', vertical: false, poster: '', preview: '', tint: ['#163a44', '#06100f'] },
];

// "Carlsbad High Football · Hype edit · 2026 · 0:42" with any blank parts left out.
window.projectMeta = (p, parts = ['client', 'kind', 'stat', 'year', 'length']) => parts.map(k => p[k]).filter(Boolean).join(' · ');
