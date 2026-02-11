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
| **2** | `bioluminescent` | Space Mono, dark theme, dual-layer BRET glow simulation, Weyl-detuned ambient pulsing |
| **3** | `EDITORIAL MODE` | Georgia serif, warm paper (#E8E3DC), hot pink (#FF006E) accent, full CRT interference simulation |

## Level 2: Bioluminescence Simulation

The bioluminescent mode models real BRET (Bioluminescence Resonance Energy Transfer) physics using layered animations, cursor-reactive particle fields, and mathematically-detuned oscillators.

### Bioluminescent Spore Field (Canvas)

A full-page canvas renders 150 drifting spore particles, each an independent bioluminescent organism:

- **Enzyme kinetics**: Each spore pulses via a Michaelis-Menten&ndash;inspired function &mdash; fast substrate binding (12% of cycle), brief plateau, then exponential product-inhibited decay. Not a sine wave.
- **Individual metabolism**: Periods are Weyl-distributed (golden ratio sequence) from 4&ndash;10s, so no two spores pulse in sync.
- **Color temperature**: Each spore sits somewhere on the cyan (480nm) to green (509nm) spectrum, interpolated via `temp` parameter.
- **Cursor attraction**: Spores within 280px of the cursor are drawn toward it and brighten &mdash; like dinoflagellates reacting to mechanical shear in the water. Move the cursor to gather and excite them.
- **Glow halos**: Brighter spores emit soft radial gradient halos around their core.

### Cursor Proximity Glow (Cards)

A JS hook (`useProximityGlow`) computes cursor distance to every interactive card each frame:

- Cards within 500px get `--prox` (0&ndash;1, quadratic falloff) driving subtle border color and box-shadow intensity
- `--prox-x` / `--prox-y` track cursor position relative to each card
- Phase offsets (`--bio-phase`, `--bio-phase-g`) are Weyl-distributed via frac(*n*&sdot;&radic;2) so no two cards pulse identically

### BRET Energy Cascade (Cyan &rarr; Green)

In real BRET, a coelenterazine donor emits at ~480nm (cyan) first, then non-radiatively transfers energy to a GFP acceptor which re-emits at ~509nm (green) with a temporal delay. Energy always flows from shorter wavelength (higher energy) to longer wavelength &mdash; a thermodynamic constraint.

Each hovered card runs two animation layers on separate CSS properties at Euler-ratio durations:

```
bioBreatheCyan:  3s      (box-shadow — cyan donor pulse)
bioBreatheGreen: 3e s    (filter — green acceptor re-emission, ~8.155s)
```

Text shifts through the emission spectrum via `textSpectrumShift`: cyan &rarr; intermediate teal &rarr; green (reversed for SE cards).

### Euler's Number Duration Coupling

The two glow layers run at durations coupled by **e** (Euler's number, &approx; 2.718). Where Level 3 uses &phi; (algebraic irrational from number theory), Level 2 uses *e* (transcendental, from calculus) &mdash; the natural constant of exponential growth and decay, and the mathematical foundation of enzyme kinetics. Near-alignment takes ~80s.

### Weyl Equidistribution (Ambient Detuning)

Where Level 3 distributes animation *phases* (R&#x2082; sequence &mdash; every element starts at a different point), Level 2 distributes animation *durations* via Weyl's equidistribution theorem:

```
duration_n = BASE + RANGE * frac(n * sqrt(2))
```

By Weyl's theorem, frac(*n*&sdot;&radic;2) is equidistributed on [0,1]. Each section line and snake track pulses at its own natural frequency (5&ndash;7s), drifting in and out of near-synchronization &mdash; like a dinoflagellate colony where each organism has its own metabolic rate.

### DNA Helix (Canvas)

The double helix uses BRET-colored strands (cyan + green) with edge-fading, sparser rungs, node dots with radial gradient halos on brighter nodes, and a slower meditative rotation.

### SE Cards: Reversed Organism

Stack Exchange cards represent a different bioluminescent species with reversed donor/acceptor: green donor flash first, cyan acceptor trailing. Text shifts green &rarr; cyan instead of cyan &rarr; green.

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
