# Editing the site

Everything that's placeholder lives in a few small files. You never need to touch the animation code.

## Projects (hero reel + Selected Work)
Selected Work shows the three projects marked `top: true` (the one marked `featured: true` goes full width), then a "See all work" button opens every project with filters.

`assets/js/projects.js` — one line per project.

| Field | What to put |
| --- | --- |
| `title`, `kind` | Shown on the reel frames, cards and player. `kind` also creates the filter chips (they appear once there are two or more kinds). |
| `featured` | `true` shows it as a full-width card. Keep featured projects at the top of the list. |
| `stat` | Optional proof point, e.g. `160K views on TikTok`. Shows as a badge on the card, on the reel frame and in the player. |
| `blurb` | Optional. A one-line pitch shown under the title in the video player. |
| `client` | Optional. Who it was for, shown next to the kind, e.g. "Carlsbad High Football · Hype edit". |
| `year`, `length` | Optional. Leave them `''` and they're hidden. |
| `youtube` | The video ID from the link: `youtube.com/watch?v=`**`ID`**, `youtu.be/`**`ID`** or `youtube.com/shorts/`**`ID`**. Clicking plays it, and the YouTube thumbnail is used automatically. |
| `vertical` | `true` for Shorts / 9:16 videos — they get a phone-shaped frame and a tall player. |
| `poster` | Optional still image instead of the YouTube thumbnail, e.g. `assets/img/projects/kids-for-peace.jpg`. |
| `preview` | Optional short silent loop (3–6s, ~720p `.mp4`). Without one, hovering a card (or the front reel frame) on desktop plays the YouTube video itself, muted. |
| `tint` | Two colours for the backdrop while the thumbnail loads. |

Order in the file = order on the reel and in the grid. With fewer than 9 projects, the reel repeats them around the loop.

## About (photo fan + bio)
In `index.html`, search for `about-fan`. The five polaroids sit in a fan that spreads apart on hover (a swipeable row on phones); `--k` on each one is its place in the fan, from `-2` (left) to `2` (right), and `--k2` is that number squared.
- Photos: put images in `assets/img/scrapbook/` and add `<img src="assets/img/scrapbook/your-photo.jpg" alt="what's in it">` inside a `.snap-photo` div (you can delete the `ph-label` span).
- The portrait next to the bio is `assets/img/scrapbook/about-me.jpg` (cropped from the original in `assets/img/src/`); search `about-portrait` in `index.html` to change it. Phone photos in HEIC need converting to JPG first; browsers can't show HEIC.
- Two polaroids are already wired up and waiting for their photos: save them as `assets/img/scrapbook/cardiff.jpg` and `assets/img/scrapbook/vista-muay-thai.jpg`. Polaroids with the `bw` class show the photo in black and white with heavier film grain. Nudge the crop with `object-position` on the `<img>`.
- Captions are the `<figcaption>` text. Wrap a place name in `<span class="loc">` to set it as a small spaced-out location line. **Don't use numbers in captions** — see the font note below.
- Bio text, the quick facts (city, year, etc.) and the "Shoots on" kit line are just above the photo fan.

## Contact
- Email: change `hello@jacksonluria.com` in `index.html` (search for it) **and** `CONTACT_EMAIL` at the top of `assets/js/contact.js`.
- Form: right now "Send it" opens the visitor's email app pre-filled. To get messages straight to your inbox, make a free form at formspree.io and paste its URL into `FORM_ENDPOINT` in `assets/js/contact.js`.
- Social links (Instagram, TikTok, YouTube) are in the contact section and the phone menu in `index.html`.

## Signature intro
On a visitor's first page load, "JL" writes itself in the hero with the slogan underneath, then glides into the nav logo. It plays once per visit, and any scroll, click or key press skips it. To change the slogan, search `assets/js/intro.js` for `Every frame, on purpose.` (no numbers: it's not in the script font, but keep it short so it stays on one line).

## Headline copy
Hero: search `index.html` for `hit harder`. Work, About and Contact intros are right under each section's heading.

## Fonts — before launch
- **Aston Script is a demo file.** It replaces numbers with an "Aston" watermark, which is why nothing set in the script font contains digits. Buy the full licence and replace `fonts/src/Aston Script.ttf`, then regenerate `fonts/aston-script.woff2`.
- **Bidena** isn't used anymore (originals kept in `fonts/src/`).
- Webfont licences: make sure each font's licence allows use on a website.

## Previewing locally
From the repo folder run `python3 -m http.server` and open http://localhost:8000.
