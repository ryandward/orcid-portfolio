# ORCID Portfolio

### [**View Live Site &rarr;**](https://ryandward.dev)

A live academic portfolio that pulls directly from the [ORCID Public API](https://pub.orcid.org), merged with LinkedIn career data and Stack Exchange stats. No database, no CMS. Update your ORCID profile and publications refresh automatically on every page visit.

Built with **Vite 7 + React 19**. Deployed on **Vercel**.

---

## Detail Levels

The site has three visual modes, toggled via the **1 / 2 / 3** buttons in the nav bar (or keyboard keys):

| Level | Name | Description |
|-------|------|-------------|
| **1** | `css: unloaded` | Times New Roman, blue links, bare HTML aesthetic ("forgot the stylesheet") |
| **2** | `bioluminescent` | Space Mono, dark theme, per-frame BRET physics (dual-exponential kinetics), enzyme-kinetic excitation |
| **3** | `EDITORIAL MODE` | Georgia serif, warm paper (#E8E3DC), hot pink (#FF006E) accent, full CRT interference simulation |

### Planned: CSS Clouds

An feTurbulence box-shadow cloud effect (`CloudSky.jsx`) is saved but not yet wired up to any detail level. The SVG filter and CSS are in place, pending visual tuning.

## Level 2: Bioluminescence Simulation

The bioluminescent mode models real BRET (Bioluminescence Resonance Energy Transfer) physics using layered animations, cursor-reactive particle fields, and mathematically-detuned oscillators.

### Bioluminescent Spore Field (Canvas)

A full-page canvas renders 250 drifting spore particles, each an independent bioluminescent organism:

- **Enzyme kinetics**: Each spore pulses via a Michaelis-Menten-inspired function: fast substrate binding (12% of cycle), brief plateau, then exponential product-inhibited decay. Not a sine wave.
- **Individual metabolism**: Periods are Weyl-distributed (golden ratio sequence) from 4-10s, so no two spores pulse in sync.
- **Color temperature**: Each spore sits somewhere on the cyan (480nm) to green (509nm) spectrum, interpolated via `temp` parameter.
- **Curiosity from a safe distance**: Three forces govern each spore's velocity every frame:

  ```
  Saturating attraction (toward cursor):
    F_attract = θ_a · (d / (d + 60)) · n̂        θ_a = 0.01

  Ornstein-Uhlenbeck mean-reversion (toward home):
    F_home = θ_ou · (x_home − x)                  θ_ou = 0.0003

  Brownian noise (stochastic wandering):
    F_noise = σ · U(−0.5, 0.5)                    σ = 0.12

  Velocity update:
    v ← (v + F_attract + F_home + F_noise) · 0.97   (viscous damping)
  ```

  The saturating term `d/(d+60)` approaches 1 at large distance but vanishes at the cursor, so spores accelerate toward it but can never arrive. OU mean-reversion pulls each spore back toward its home position, creating a stable equilibrium between "toward cursor" and "toward home." Brownian noise adds organic stochasticity. The result: spores investigate the cursor from a safe distance, like dinoflagellates drawn to, but not consumed by, mechanical shear.
- **Glow halos**: Brighter spores emit soft radial gradient halos around their core.

### Cursor Proximity Glow (Cards)

A JS hook (`useProximityGlow`) runs a `requestAnimationFrame` loop that evaluates the full BRET kinetic equations every frame for every card:

- **Spectral colors from design variables**: On mount, reads `--cyan` (donor) and `--accent` (acceptor) from computed styles, parses them to RGB, and sets `--cyan-rgb` / `--accent-rgb` on `:root`. Precomputes the fixed surface emission color `C = (1-ε)·C_donor + ε·C_acceptor` for use in `--bret-text`. Zero hardcoded RGB values.
- **Emission geometry from JS**: Sets `--bret-d-r1`, `--bret-d-r2`, `--bret-a-r1`, `--bret-a-r2`, `--bret-halo-falloff` on `:root` at init. CSS consumes these for box-shadow; JS uses the same constants × `TEXT_SCALE` for text-shadow. Single source of truth.
- **Proximity variables**: Cards within 400px get `--prox` (0-1, quadratic falloff). `--prox-x` / `--prox-y` track cursor position relative to each card.

### Per-Frame BRET Physics (No Keyframes)

**No CSS keyframes.** All temporal dynamics are computed per-frame by `useProximityGlow.js` using the actual BRET dual-exponential kinetic equations:

```
Donor emission:
  I_D(t) = (1-ε) · exp(-k_D · (t - t₀))

Acceptor cascade (two-state kinetics):
  I_A(t) = ε · k_D/(k_D - k_A) · [exp(-k_A·(t-t₀)) - exp(-k_D·(t-t₀))]

Parameters:
  ε = 0.5 (FRET efficiency), τ_D = 0.06 (donor lifetime), τ_A = 0.20 (acceptor lifetime)
  t₀ = 0.03 (trigger time), cycle = 3s (unified for all elements)
```

Each frame, for each card, the JS:
1. Updates enzyme-kinetic excitation envelope (`exc`)
2. Advances BRET phase (resets to 0 on each new hover — hover = substrate binding event)
3. Evaluates `donorIntensity(phase)` and `acceptorIntensity(phase)`
4. Sets per-card CSS custom properties:
   - `--bret-d` = excitation × donor intensity (drives `::before` opacity)
   - `--bret-a` = excitation × acceptor intensity (drives `::after` opacity)
   - `--bret-text` = fully opaque surface color, exc-gated (set while active, removed at rest → base color cascades via CSS transition)
   - `--bret-glow` = dual-channel text-shadow, flux-gated (pulses with BRET kinetics)

### Dual Pseudo-Element Emission Channels

Two pseudo-elements form independent emission channels (true additive overlap):

```
::before = donor channel     opacity: var(--bret-d)   tight halo (var(--bret-d-r1) + var(--bret-d-r2) box-shadow)
::after  = acceptor channel  opacity: var(--bret-a)   diffuse halo (var(--bret-a-r1) + var(--bret-a-r2) box-shadow)
```

Each has STATIC box-shadow at full alpha — opacity alone drives temporal dynamics. Since opacity is compositable, this is GPU-accelerated (no main-thread repaints).

**Emission geometry** is defined once in JS (`DONOR_R_INNER=40`, `DONOR_R_OUTER=80`, `ACCEPTOR_R_INNER=80`, `ACCEPTOR_R_OUTER=160`, `HALO_FALLOFF=0.5`) and set as CSS custom properties at init. The 2× ratio (acceptor wider than donor) models wavelength-dependent Mie scattering: shorter-wavelength donor emission (~480nm) has a tighter point-spread function than the longer-wavelength acceptor (~509nm). Text-shadow radii derive from the same constants × `TEXT_SCALE` (0.2).

- **Normal species** (cyan donor → green acceptor): `.snake-card`, `.pub-card`, `.lnk`, `.kw`
- **Reversed species** (green donor → cyan acceptor): `.se-card`

### Text BRET: Surface vs. Field

The text and outline model two physically distinct phenomena:

1. **Text color** = the emitting surface (excitation-gated, fully opaque). JS sets `--bret-text` to `rgb(surfaceColor)` when `exc > EXC_FLOOR`, and removes it when inactive. When absent, `var(--bret-text)` is invalid → the `color` declaration is discarded → the **base text color** (e.g. `var(--text-bright)` white for `.snake-role`) cascades through. When set, the text snaps to the fixed FRET surface color `C = (1-ε)·C_donor + ε·C_acceptor`. CSS `transition: color` is killed (`0s`) on all BRET text elements in detail-2 — otherwise the browser re-triggers the transition on every computed-value reevaluation, animating through white on each BRET cycle.

2. **Text-shadow** = the emitted photon field. Two independent channel layers (donor cyan, acceptor green) with time-varying intensities follow the same BRET kinetics as the outline's `::before`/`::after` pseudo-elements. The far-field spectral shift (cyan → green as the cascade progresses) is correctly captured here because the two layers have independent alphas. Radii are derived from the same emission geometry constants × `TEXT_SCALE`.

The distinction matters: at rest, text shows its base color (white). On hover, `--bret-text` is set and text immediately shows the FRET surface color (no CSS transition — it's killed in detail-2). The glow field (text-shadow + box-shadow) pulses with the BRET cascade on top. After unhover, excitation decays until `--bret-text` is removed and the base color returns.

### Enzyme-Kinetic Excitation Envelope

Per-card excitation (0→1) using enzyme kinetics:

```
Rise (hovered):    exc += (1 - exc) * 0.08   (τ_rise ≈ 0.21s, rapid substrate binding)
Decay (unhovered): exc *= 0.97               (τ_decay ≈ 0.55s, product-inhibited release)
Snap to 0:         when exc < 0.005, phase resets — next hover starts emission from t=0
```

The hero name is always fully excited (exc=1), modeled as a high-expression strain with `HERO_SCATTER=3` (wider PSF from more photons per cell → wider text-shadow radii).

### DNA Helix (Canvas)

The double helix uses BRET-colored strands (cyan + green) with edge-fading, sparser rungs, node dots with radial gradient halos on brighter nodes, and a slower meditative rotation.

### SE Cards: Reversed Organism

Stack Exchange cards represent a different bioluminescent species with reversed donor/acceptor: green donor flash first, cyan acceptor trailing. The species type is determined by `REVERSED_SELECTOR = '.se-card'` (single source of truth in JS) which swaps channel colors for both the outline box-shadow (via CSS selectors consuming the same `--cyan-rgb`/`--accent-rgb` variables) and the text-shadow layers.

## Level 3: CRT Simulation

The editorial mode simulates a malfunctioning CRT/neon display using layered CSS animations and two key mathematical principles:

### Golden Ratio Duration Coupling

Each CRT effect is decomposed into independent animation layers that control separate CSS properties. The layers run at durations whose ratio is **&phi;** (the golden ratio, &approx; 1.618):

```
crtDim:   4s        (opacity, power sag)
crtSplit: 4 * phi s  (text-shadow, chromatic aberration)
```

&phi; is the "most irrational" number. Its continued fraction `[1;1,1,1,...]` converges slower than any other irrational, meaning these two oscillators take the **longest mathematically possible time** to near-sync. The emergent combination of power dips and chromatic splits never visibly repeats.

### Perlin Noise Displacement (Cathode Interference)

On hover, card content is warped through an SVG `feTurbulence` → `feDisplacementMap` pipeline. Ken Perlin's gradient noise algorithm (1983 SIGGRAPH, later awarded an Academy Award for Technical Achievement) generates **fractal Brownian motion** that displaces pixels horizontally, exactly like real CRT signal interference.

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

The asymmetric `baseFrequency` is key: low X frequency creates wide, coherent horizontal distortion while high Y frequency varies rapidly per scan line, the exact signature of analog signal interference. The `seed` attribute cycles through discrete values (no interpolation), creating the characteristic jitter of a malfunctioning display.

### R&#x2082; Low-Discrepancy Phase Distribution

For always-on elements (hero name, keyword pills), each element needs a unique starting phase so they don't flicker in unison. Rather than using `Math.random()`, phases are distributed using the **R&#x2082; quasi-random sequence** based on the **plastic constant** (p &approx; 1.3247, the real root of p&sup3; = p + 1):

```
offset_n = (n/p mod 1,  n/p^2 mod 1)
```

This generates the optimal 2D low-discrepancy sequence. The (dim phase, split phase) pairs fill the 2D phase space as uniformly as possible with no clumping and no gaps. The same algorithm family (Halton, Sobol, R-sequences) is used in Monte Carlo rendering for importance sampling.

### Other CRT Techniques

- **Chromatic aberration**: Pink (#FF006E) always LEFT (-X), cyan (#00D4FF) always RIGHT (+X) in `text-shadow`. Pink renders in front (declared first in shadow stack).
- **Power sag**: After each chromatic burst, opacity drops to ~25% with `text-shadow: none` as the tube recharges.
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

**ORCID ID** in `src/constants.js`:

```js
export const ORCID_ID = '0000-0001-9537-2461'
```

**LinkedIn data** is the `LINKEDIN` object in the same file, from a LinkedIn export (Settings &rarr; Data Privacy &rarr; Get a copy of your data).

## How It Works

Publications, education, keywords, and researcher URLs are fetched client-side from the ORCID public API on every page load. No rebuild needed when you update your ORCID profile. Career history comes from a LinkedIn data export stored as a JS object in the source.

| Endpoint | Data |
|---|---|
| `/v3.0/{id}/person` | Name, bio, keywords, URLs |
| `/v3.0/{id}/works` | Publications |
| `/v3.0/{id}/educations` | Education history |
| Stack Exchange API | Reputation, top answers |

## License

MIT
