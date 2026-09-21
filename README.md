# Cost of a Click — static site

A hand-built static rebuild of the Framer project **Impact Grant Website**
(`RoCp6peZwCzIxIoDmLSu`, published at `theenvironmentremembers.framer.website`).

Every page, colour token, type value and layout number was read out of the
Framer canvas itself (node tree + measured rects), not eyeballed from a
screenshot.

## Pages

| File | Framer page |
|---|---|
| `index.html` | `/` — the about content, now serving as the home page |
| `research.html` | `/research` |
| `code-your-dream.html` | `/code-your-dream` (nav only — the canvas is empty) |
| `contact.html` | `/contact` |
| `interactive-map.html` | `/interactive-map` |
| `map.html` | `/map` — full-viewport map stage |

Navigation: Home → **Explore the Map** → `interactive-map.html`.
`interactive-map.html` also links down to the full-screen `map.html`.

## Code components

The three Framer code components were ported to vanilla JS, keeping the
original algorithms intact:

- `assets/js/dot-globe.js` — port of `DotGlobe.tsx`. Raw-WebGL point cloud,
  same vertex/fragment shaders, tilt, hidden-hemisphere culling, glow → canvas
  → scrim → grain stack and the periodic band-displacement glitch.
  `assets/js/land-bits.js` holds the baked Natural Earth land mask verbatim.
- `assets/js/midwest-site-map.js` — port of `MidwestSiteMap.tsx`. Same Albers
  geometry (`assets/js/state-paths.js`), deterministic star field, drag-pan,
  wheel zoom, Esc-to-reset, marker selection and the sliding community card.
- `assets/js/site.js` — Reveal Text (`Reveal_Text.tsx`), the Appear effects,
  the animated number counters and the timeline progress bars.

`assets/js/ascii-art.js` carries the exact character grids the marketplace
"Interactive ASCII" component renders on the published site, captured from the
live DOM and stored run-length encoded, then drawn as the same blurred + sharp
pair of `<pre>` layers.

## Assets

`assets/img/` holds the Framer-hosted images and the Unsplash site photos used
by the map cards, downloaded so the site runs without those CDNs.
`us-outline.svg` is the state-border shape exported straight from the canvas.

The two Cost of a Click 2.0 map cards added later carry their own credits:

- `site-newcarlisle.jpg` — AWS press photo of the Project Rainier campus
  (New Carlisle, IN), from Amazon's newsroom
  (`aboutamazon.com/news/aws/aws-project-rainier-ai-trainium-chips-compute-cluster`).
  Amazon-owned image, reproduced for editorial use; credit Amazon if published.
- `site-grandrapids.jpg` — the Steelcase Pyramid, now Switch's Michigan campus.
  Public domain, from Wikipedia (`File:Steelcase Pyramid 2008.png`, uploader
  Trance88), cropped to 16:9.

Web fonts (Inter, Playfair Display, Gilda Display, Instrument Sans, Geist Mono,
Fragment Mono) come from Google Fonts; Pretendard Variable from jsDelivr.

## Running it

There is nothing to install and nothing to build. You only need Python, which
most computers already have.

### Windows

1. Open the Start menu, type `powershell`, press Enter. A blue window opens.
2. Copy the two lines below and paste them into that window (right-click pastes),
   then press Enter:

```powershell
cd "c:\Users\Arushi's-pc\Projects\coac-info\cost-of-a-click"
python -m http.server 5177
```

3. It will print `Serving HTTP on :: port 5177 ...`. Leave the window open.
4. Open your browser and go to **http://localhost:5177/**

To stop the site, click the PowerShell window and press `Ctrl` + `C`, or just
close the window.

### macOS / Linux

Same idea, in Terminal — replace the path with wherever the folder lives:

```bash
cd ~/path/to/cost-of-a-click
python3 -m http.server 5177
```

Then open **http://localhost:5177/**

### Troubleshooting

- **"python is not recognized"** — Python isn't installed. Get it from
  [python.org/downloads](https://www.python.org/downloads/) and tick
  *"Add python.exe to PATH"* during setup. On macOS use `python3`.
- **"Address already in use"** — something is already on port 5177. Change both
  the command and the URL to another number, e.g. `5178`.
- **The page loads but looks wrong** — the fonts come from Google Fonts and
  jsDelivr, so you need an internet connection for the type to render correctly.
- **Numbers show as 0** — the statistics are animated counters that fill in when
  you scroll them into view. Scroll down to the section rather than expecting
  them on load.

### Without a server

Double-clicking `index.html` also works — no page uses `fetch` or ES modules, so
opening it straight from the file system won't break anything. The local server
is just closer to how it behaves when published.

## Responsive

The desktop breakpoint is reproduced 1:1. The Framer project also ships a
separate Phone canvas with its own content; rather than duplicating that second
canvas, the CSS collapses the desktop layout at 1100px and 860px.
