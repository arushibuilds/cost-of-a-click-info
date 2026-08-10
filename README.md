# Cost of a Click — static site

A hand-built static rebuild of the Framer project **Impact Grant Website**
(`RoCp6peZwCzIxIoDmLSu`, published at `theenvironmentremembers.framer.website`).

Every page, colour token, type value and layout number was read out of the
Framer canvas itself (node tree + measured rects), not eyeballed from a
screenshot.

## Pages

| File | Framer page |
|---|---|
| `index.html` | `/` — hero + dot-matrix globe |
| `about.html` | `/about` |
| `research.html` | `/research` |
| `code-your-dream.html` | `/code-your-dream` (nav only — the canvas is empty) |
| `contact.html` | `/contact` |
| `interactive-map.html` | `/interactive-map` |
| `map.html` | `/map` — full-viewport map stage |

Navigation: About → **Explore the Map** → `interactive-map.html`.
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

Web fonts (Inter, Playfair Display, Gilda Display, Instrument Sans, Geist Mono,
Fragment Mono) come from Google Fonts; Pretendard Variable from jsDelivr.

## Running it

Any static server works:

```bash
python3 -m http.server 5177 --directory /Users/yoon/impactgrant
```

## Responsive

The desktop breakpoint is reproduced 1:1. The Framer project also ships a
separate Phone canvas with its own content; rather than duplicating that second
canvas, the CSS collapses the desktop layout at 1100px and 860px.
