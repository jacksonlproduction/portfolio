# Editing the site

Everything that's placeholder lives in a few small files. You never need to touch the animation code.

## Projects (hero reel + Selected Work)
`assets/js/projects.js` — one line per project.

| Field | What to put |
| --- | --- |
| `title`, `kind` | Shown on the reel frames, cards and player. `kind` also creates the filter chips. |
| `year`, `length` | Optional. Leave them `''` and they're hidden. |
| `youtube` | The video ID from the link: `youtube.com/watch?v=`**`ID`**, `youtu.be/`**`ID`** or `youtube.com/shorts/`**`ID`**. Clicking plays it, and the YouTube thumbnail is used automatically. |
| `vertical` | `true` for Shorts / 9:16 videos — they get a phone-shaped frame and a tall player. |
| `poster` | Optional still image instead of the YouTube thumbnail, e.g. `assets/img/projects/kids-for-peace.jpg`. |
| `preview` | Optional short silent loop (3–6s, ~720p `.mp4`) that plays when someone hovers the card. |
| `tint` | Two colours for the backdrop while the thumbnail loads. |

Order in the file = order on the reel and in the grid. With fewer than 9 projects, the reel repeats them around the loop.

## About (scrapbook + bio)
In `index.html`, search for `ABOUT (scrapbook)`.
- Photos: put images in `assets/img/scrapbook/` and add `<img src="assets/img/scrapbook/your-photo.jpg" alt="what's in it">` inside a `.snap-photo` div (you can delete the `ph-label` span).
- Captions are the `<figcaption>` text. **Don't use numbers in captions** — see the font note below.
- Bio text, the quick facts (city, year, etc.) and the "Shoots on" kit line are right below the scrapbook.

## Contact
- Email: change `hello@jacksonluria.com` in `index.html` (search for it) **and** `CONTACT_EMAIL` at the top of `assets/js/contact.js`.
- Form: right now "Send it" opens the visitor's email app pre-filled. To get messages straight to your inbox, make a free form at formspree.io and paste its URL into `FORM_ENDPOINT` in `assets/js/contact.js`.
- Social links (Instagram, TikTok, YouTube) are in the contact section and the phone menu in `index.html`.

## Headline copy
Hero: search `index.html` for `hit harder`. Work, About and Contact intros are right under each section's heading.

## Fonts — before launch
- **Aston Script is a demo file.** It replaces numbers with an "Aston" watermark, which is why nothing set in the script font contains digits. Buy the full licence and replace `fonts/src/Aston Script.ttf`, then regenerate `fonts/aston-script.woff2`.
- **Bidena** isn't used anymore (originals kept in `fonts/src/`).
- Webfont licences: make sure each font's licence allows use on a website.

## Previewing locally
From the repo folder run `python3 -m http.server` and open http://localhost:8000.
