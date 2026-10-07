# Editing the site

Everything that's placeholder lives in a few small files. You never need to touch the animation code.

## Projects (hero reel + Selected Work)
`assets/js/projects.js` — one line per project.

| Field | What to put |
| --- | --- |
| `title`, `kind`, `year`, `length` | Shown on the reel frames, cards and lightbox. `kind` also creates the filter chips. |
| `youtube` | The video ID from the link: `youtube.com/watch?v=`**`dQw4w9WgXcQ`** or `youtu.be/`**`dQw4w9WgXcQ`**. Clicking the project plays it, and its YouTube thumbnail is used automatically. |
| `poster` | Optional still image instead of the YouTube thumbnail, e.g. `assets/img/projects/friday-night-lights.jpg`. |
| `preview` | Optional short silent loop (3–6s, ~720p `.mp4`) that plays when someone hovers the card, e.g. `assets/video/previews/friday-night-lights.mp4`. |
| `tint` | Two colours for the placeholder gradient. Ignored once there's a poster or YouTube ID. |

Order in the file = order on the reel and in the grid.

## Gear
`assets/js/gear-data.js` — the four devices shown in 3D (Lumix S5, Lumix S9, Blackmagic Pocket 6K Pro, DJI Mavic 3 Pro): notes, specs, hotspot text, the S9 colour swatches, and the kit list below the viewer. Edit the `note` lines to say how you actually use each one.
The 3D models themselves are built in `assets/js/gear3d.js` (one `build…` function per device).

## About (scrapbook + bio)
In `index.html`, search for `ABOUT (scrapbook)`.
- Photos: put images in `assets/img/scrapbook/` and add `<img src="assets/img/scrapbook/your-photo.jpg" alt="what's in it">` inside a `.snap-photo` div (you can delete the `ph-label` span).
- Captions are the `<figcaption>` text. **Don't use numbers in captions** — see the font note below.
- Bio text and the four quick facts (city, year, etc.) are right below the scrapbook.

## Contact
- Email: change `hello@jacksonluria.com` in `index.html` (search for it) **and** `CONTACT_EMAIL` at the top of `assets/js/contact.js`.
- Form: right now "Send it" opens the visitor's email app pre-filled. To get messages straight to your inbox, make a free form at formspree.io and paste its URL into `FORM_ENDPOINT` in `assets/js/contact.js`.
- Social links (Instagram, TikTok, YouTube) are in the contact section and the phone menu in `index.html`.

## Headline copy
Hero: search `index.html` for `hit harder`. Work, Gear, About and Contact intros are right under each section's heading.

## Fonts — before launch
- **Aston Script is a demo file.** It replaces numbers with an "Aston" watermark, which is why nothing set in the script font contains digits. Buy the full licence and replace `fonts/src/Aston Script.ttf`, then regenerate `fonts/aston-script.woff2`.
- **Bidena** isn't used anymore (originals kept in `fonts/src/`).
- Webfont licences: make sure each font's licence allows use on a website.

## Previewing locally
From the repo folder run `python3 -m http.server` and open http://localhost:8000.
