# ORCID Portfolio

### [**View Live Site &rarr;**](https://ryandward.dev)

A live academic portfolio that pulls directly from the [ORCID Public API](https://pub.orcid.org), merged with LinkedIn career data and Stack Exchange stats. No database, no CMS — update your ORCID profile and publications refresh automatically on every page visit.

Built with **Vite 7 + React 19**. Deployed on **Vercel**.

---

## Detail Levels

The site has three visual modes, toggled via the **1 / 2 / 3** buttons in the nav bar (or keyboard keys):

| Level | Name | Description |
|-------|------|-------------|
| **1** | `css: unloaded` | Times New Roman, blue links, bare HTML aesthetic — "forgot the stylesheet" |
| **2** | `detail: normal` | Space Mono, dark theme, green accent, animated DNA helix canvas |
| **3** | `EDITORIAL MODE` | Georgia serif, warm paper (#E8E3DC), hot pink (#FF006E) accent, full CRT interference simulation |

## Level 3: CRT Simulation

The editorial mode simulates a malfunctioning CRT/neon display using layered CSS animations and two key mathematical principles:

### Golden Ratio Duration Coupling

Each CRT effect is decomposed into independent animation layers that control separate CSS properties. The layers run at durations whose ratio is **&phi;** (the golden ratio, &approx; 1.618):

```
crtDim:   4s        (opacity — power sag)
crtSplit: 4 * phi s  (text-shadow — chromatic aberration)
```

&phi; is the "most irrational" number — its continued fraction `[1;1,1,1,...]` converges slower than any other irrational, meaning these two oscillators take the **longest mathematically possible time** to near-sync. The emergent combination of power dips and chromatic splits never visibly repeats.

### Perlin Noise Displacement (Cathode Interference)

On hover, card content is warped through an SVG `feTurbulence` → `feDisplacementMap` pipeline — Ken Perlin's gradient noise algorithm (1983 SIGGRAPH, later awarded an Academy Award for Technical Achievement) generates **fractal Brownian motion** that displaces pixels horizontally, exactly like real CRT signal interference.

```
feTurbulence:
  type:          fractalNoise
  baseFrequency: 0.015 (X) × 0.8 (Y)    ← asymmetric: coherent horizontal bands
  numOctaves:    3                         ← three octaves of fBm detail
  seed:          animated discretely ~12fps ← jittery, non-interpolated changes

feDisplacementMap:
  scale: 5                                 ← pixels of maximum displacement
  xChannelSelector: R, yChannelSelector: G ← independent per-axis noise channels
```

The asymmetric `baseFrequency` is key: low X frequency creates wide, coherent horizontal distortion while high Y frequency varies rapidly per scan line — the exact signature of analog signal interference. The `seed` attribute cycles through discrete values (no interpolation), creating the characteristic jitter of a malfunctioning display.

### R&#x2082; Low-Discrepancy Phase Distribution

For always-on elements (hero name, keyword pills), each element needs a unique starting phase so they don't flicker in unison. Rather than using `Math.random()`, phases are distributed using the **R&#x2082; quasi-random sequence** based on the **plastic constant** (p &approx; 1.3247, the real root of p&sup3; = p + 1):

```
offset_n = (n/p mod 1,  n/p^2 mod 1)
```

This generates the optimal 2D low-discrepancy sequence — the (dim phase, split phase) pairs fill the 2D phase space as uniformly as possible with no clumping and no gaps. The same algorithm family (Halton, Sobol, R-sequences) is used in Monte Carlo rendering for importance sampling.

### Other CRT Techniques

- **Chromatic aberration**: Pink (#FF006E) always LEFT (-X), cyan (#00D4FF) always RIGHT (+X) in `text-shadow`. Pink renders in front (declared first in shadow stack).
- **Power sag**: After each chromatic burst, opacity drops to ~25% with `text-shadow: none` — the tube recharging.
- **Scanlines**: `::before` pseudo-elements with repeating-linear-gradient.
- **Paint splatter**: Three static layers with async brightening on coprime cycle times (7s/11s) for organic feel.
- **All offsets in `em` units**: Chromatic aberration scales proportionally with font size.

## Touch-Hover System

On touch devices (levels 2 and 3), interactive elements use a two-tap pattern:

1. **First tap**: Adds `.th` class, triggering all hover effects (CRT animations, glitch bands)
2. **Second tap**: Removes `.th` and follows the link

All hover selectors use the `:is(:hover,.th)` pattern. Nav links are exempt (navigate immediately on first tap).

## Features

- Live publication data from ORCID Public API (v3.0, no key required)
- Full career timeline from LinkedIn export
- Stack Exchange reputation and top answers (cached 1hr)
- DOI links for all publications
- Education history from ORCID
- Research keywords and skills
- Responsive design with mobile-specific overrides
- Three visual modes with seamless switching

## Quick Start

```bash
npm install
npm run dev
```

## Customize

**ORCID ID** — edit `src/constants.js`:

```js
export const ORCID_ID = '0000-0001-9537-2461'
```

**LinkedIn data** — edit the `LINKEDIN` object in the same file. This is static data from a LinkedIn export (Settings &rarr; Data Privacy &rarr; Get a copy of your data).

## How It Works

Publications, education, keywords, and researcher URLs are fetched client-side from the ORCID public API on every page load — no rebuild needed when you update your ORCID profile. Career history comes from a LinkedIn data export stored as a JS object in the source.

| Endpoint | Data |
|---|---|
| `/v3.0/{id}/person` | Name, bio, keywords, URLs |
| `/v3.0/{id}/works` | Publications |
| `/v3.0/{id}/educations` | Education history |
| Stack Exchange API | Reputation, top answers |

## License

MIT
