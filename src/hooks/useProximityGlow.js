import { useEffect, useRef } from 'react'

/**
 * useProximityGlow — per-frame BRET temporal dynamics + enzyme-kinetic excitation.
 *
 * Every frame, for each card:
 *   1. Enzyme kinetics drive excitation (0→1):
 *        Rise:  exc += (1 - exc) * K_BIND     (rapid substrate binding)
 *        Decay: exc *= K_RELEASE               (product-inhibited release)
 *
 *   2. BRET phase advances while excited (or always for hero):
 *        phase += dt / 3s                       (unified cycle for all elements)
 *
 *   3. Dual-exponential BRET model evaluated at current phase:
 *        I_D(t) = (1 - ε) · exp(-k_D · (t - t₀))
 *        I_A(t) = ε · k_D/(k_D - k_A) · [exp(-k_A·(t-t₀)) - exp(-k_D·(t-t₀))]
 *
 *   4. Outputs set as CSS custom properties on each card:
 *        --bret-d     = exc × I_D(phase)        (donor intensity, excitation-weighted)
 *        --bret-a     = exc × I_A(phase) × norm  (acceptor intensity, normalized + weighted)
 *        --bret-text  = rgb(surface)            (exc-gated: set while active, removed at rest)
 *        --bret-glow  = dual-channel text-shadow  (flux-gated: pulses with BRET kinetics)
 *
 *   5. CSS uses these directly:
 *        ::before  opacity = var(--bret-d)  →  donor emission channel (far field)
 *        ::after   opacity = var(--bret-a)  →  acceptor emission channel (far field)
 *        text      color = var(--bret-text) →  absent at rest (base color cascades),
 *                                               present while excited (surface FRET color)
 *        text      text-shadow = var(--bret-glow) → emitted photon field (dual-channel)
 *
 * BRET model: dual-exponential cascade (A→B→C kinetics)
 *   Donor decays as single exponential after substrate trigger at t₀.
 *   Acceptor follows the classic two-state cascade: rises as donor
 *   transfers energy (rate k_D), then decays with its own lifetime (rate k_A).
 *   At any instant, both channels are independently visible — their additive
 *   overlap IS the bioluminescence resonance energy transfer.
 *
 * Emission geometry (single source of truth):
 *   Outline (CSS ::before/::after) and text (JS text-shadow) share the same
 *   physical constants. JS sets CSS custom properties at init; CSS consumes them
 *   for box-shadow radii. JS derives text-shadow radii from the same constants
 *   via TEXT_SCALE. No magic numbers exist in CSS — all geometry is defined here.
 *
 * Phase: resets to 0 on each new hover — the substrate binding event (t₀)
 * IS the hover. Every card shows the full emission cascade from the start.
 */

const RADIUS = 400

// ── Enzyme kinetics rate constants (per frame at ~60fps) ──
const K_BIND = 0.08     // substrate binding rate (rise τ ≈ 0.21s)
const K_RELEASE = 0.97   // product release damping (decay τ ≈ 0.55s)
const EXC_FLOOR = 0.005  // below this, snap to 0

// ── BRET temporal dynamics (phase ∈ [0,1] maps to one full cycle) ──
const EPS_FRET = 0.5    // FRET efficiency (Förster radius ≈ intermolecular distance)
const TAU_D = 0.06       // donor luminescence lifetime (6% of cycle)
const TAU_A = 0.20       // acceptor emission lifetime (20% of cycle)
const T0 = 0.03          // trigger time — substrate binding event (3% of cycle)

const K_D = 1 / TAU_D    // donor decay rate (16.67)
const K_A = 1 / TAU_A    // acceptor decay rate (5.0)

// ── Emission geometry — single source of truth ──
// These constants define the spatial extent of each emission channel.
// Both the CSS outline (box-shadow via custom properties) and the JS text
// (text-shadow computed per-frame) derive from these values.
//
// Physical basis: donor emission has shorter wavelength (higher energy, cyan ~480nm)
// → tighter point-spread function. Acceptor emission has longer wavelength
// (lower energy, green ~509nm) → broader diffusion through the medium.
// The 2× ratio (acceptor/donor) models the wavelength-dependent scattering
// cross-section in biological tissue: σ_s ∝ λ^(-b) where b ≈ 1–2 for
// Mie scattering in cells. At these wavelengths the ratio is approximately 2:1.
const DONOR_R_INNER = 40    // donor tight halo radius (px)
const DONOR_R_OUTER = 80    // donor diffuse halo radius (px)
const ACCEPTOR_R_INNER = 80  // acceptor tight halo radius (px)
const ACCEPTOR_R_OUTER = 160 // acceptor diffuse halo radius (px)

// Halo falloff: the outer layer of each channel has this fraction of the
// inner layer's intensity. Models radial intensity decay of a Gaussian beam
// profile: I(r) ∝ exp(-2r²/w²). At r_outer ≈ 2×r_inner, the ratio is ~0.5.
const HALO_FALLOFF = 0.5

// Text-shadow scale relative to outline box-shadow. The text emits from the
// same molecular complex but is rendered at smaller spatial scale (glyphs vs.
// card boundary). This is the ratio of the text emission PSF to the outline PSF.
const TEXT_SCALE = 0.2

// ── Hero organism: wider scatter ──
// Hero models a high-expression strain with more luciferase molecules per cell.
// More photons → wider point-spread function for the text glow field.
const HERO_SCATTER = 3        // PSF width multiplier (more photons → wider scatter)

// ── Reversed-species selector ──
// In the normal BRET pair, cyan is donor and green is acceptor.
// Some organisms (modeled here as .se-card) have the reversed pair:
// green donor → cyan acceptor. This is the single source of truth for
// which CSS class triggers the spectral reversal.
const REVERSED_SELECTOR = '.se-card'

// Parse any CSS color to [r,g,b] via canvas 2d context
function parseColorRgb(color) {
  const ctx = document.createElement('canvas').getContext('2d')
  ctx.fillStyle = color
  const hex = ctx.fillStyle  // always normalizes to #rrggbb
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

// FRET additive superposition: (1-ε)·donor + ε·acceptor
function fretMix(donor, acceptor, efficiency) {
  return donor.map((d, i) =>
    Math.round((1 - efficiency) * d + efficiency * acceptor[i])
  )
}

// BRET donor emission intensity at time t (0-1 fraction of cycle)
// I_D(t) = (1-ε) · exp(-k_D · (t - t0))  for t ≥ t0, else 0
function donorIntensity(t) {
  const s = t - T0
  return s < 0 ? 0 : (1 - EPS_FRET) * Math.exp(-K_D * s)
}

// BRET acceptor emission intensity at time t (two-state kinetic cascade)
// I_A(t) = ε · k_D/(k_D - k_A) · [exp(-k_A·s) - exp(-k_D·s)]
function acceptorIntensity(t) {
  const s = t - T0
  return s < 0 ? 0 : EPS_FRET * K_D / (K_D - K_A) * (Math.exp(-K_A * s) - Math.exp(-K_D * s))
}

/**
 * Build a CSS text-shadow string for one emission channel.
 *
 * Mirrors the outline's box-shadow structure exactly:
 *   box-shadow: 0 0 R_INNER rgba(color, 1), 0 0 R_OUTER rgba(color, HALO_FALLOFF)
 *   at pseudo-element opacity = channelIntensity
 *
 * For text, the effective alpha per layer is channelIntensity × layerWeight
 * (inner = 1, outer = HALO_FALLOFF), and radii are scaled by TEXT_SCALE × scatter.
 *
 * This is the analytical equivalent of the outline's opacity-modulated box-shadow:
 *   outline effective alpha = opacity × box-shadow-alpha = bretChannel × [1, HALO_FALLOFF]
 *   text effective alpha    = text-shadow-alpha           = bretChannel × [1, HALO_FALLOFF]
 */
function channelTextShadow(rgb, intensity, rInner, rOuter, scale) {
  const r1 = rInner * scale
  const r2 = rOuter * scale
  const a1 = intensity
  const a2 = intensity * HALO_FALLOFF
  return [
    `0 0 ${r1}px rgba(${rgb},${a1.toFixed(4)})`,
    `0 0 ${r2}px rgba(${rgb},${a2.toFixed(4)})`,
  ]
}

export default function useProximityGlow(active, selector = '.glow-card, .kw, .hero-name-line.accent') {
  const rafRef = useRef(null)
  const excitationRef = useRef(new WeakMap())
  const phaseRef = useRef(new WeakMap())

  useEffect(() => {
    if (!active) return

    const root = document.documentElement
    const rootStyle = getComputedStyle(root)
    const excMap = excitationRef.current
    const phaseMap = phaseRef.current

    // ── FRET spectral colors (from design variables) ──
    const donor = parseColorRgb(rootStyle.getPropertyValue('--cyan').trim())
    const acceptor = parseColorRgb(rootStyle.getPropertyValue('--accent').trim())

    const donorRgb = donor.join(',')
    const accRgb = acceptor.join(',')

    // ── Organism surface color (fixed spectral identity) ──
    // C_surface = (1 - ε)·C_donor + ε·C_acceptor
    // Precomputed once — this is a molecular constant, not a per-frame value.
    // Since ε = 0.5, normal and reversed are identical, but we keep both for
    // clarity if ε ever changes.
    const surfaceRgb = fretMix(donor, acceptor, EPS_FRET).join(',')

    // Set CSS custom properties consumed by outline box-shadow:
    //   Color channels
    root.style.setProperty('--cyan-rgb', donorRgb)
    root.style.setProperty('--accent-rgb', accRgb)
    //   Emission geometry (for pseudo-element box-shadow radii)
    root.style.setProperty('--bret-d-r1', `${DONOR_R_INNER}px`)
    root.style.setProperty('--bret-d-r2', `${DONOR_R_OUTER}px`)
    root.style.setProperty('--bret-a-r1', `${ACCEPTOR_R_INNER}px`)
    root.style.setProperty('--bret-a-r2', `${ACCEPTOR_R_OUTER}px`)
    root.style.setProperty('--bret-halo-falloff', HALO_FALLOFF)

    // Acceptor peak normalization: scale so peak alpha = 0.50
    // t_peak = t0 + ln(k_D/k_A) / (k_D - k_A)
    const maxIA = acceptorIntensity(T0 + Math.log(K_D / K_A) / (K_D - K_A))
    const normA = 0.50 / maxIA

    let mouseX = -9999
    let mouseY = -9999

    function onMouseMove(e) {
      mouseX = e.clientX
      mouseY = e.clientY
    }
    function onTouchMove(e) {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX
        mouseY = e.touches[0].clientY
      }
    }
    function onTouchEnd() {
      mouseX = -9999
      mouseY = -9999
    }

    function update() {
      const cards = document.querySelectorAll(selector)
      for (const card of cards) {
        const isHovered = card.matches(':hover, .th')
        const isHero = card.matches('.hero-name-line')

        // ── Enzyme kinetics: excitation envelope ──
        let exc = excMap.get(card) || 0
        if (isHero) {
          exc = 1  // hero is always fully excited (saturated substrate)
        } else if (isHovered) {
          exc += (1 - exc) * K_BIND    // rapid substrate binding
        } else {
          exc *= K_RELEASE              // product-inhibited decay
          if (exc < EXC_FLOOR) {
            exc = 0
            phaseMap.delete(card)       // reset phase — next hover starts at t=0
          }
        }
        excMap.set(card, exc)

        // ── BRET temporal dynamics: per-frame evaluation ──
        // Phase starts at 0 on each new hover (substrate binding triggers emission).
        // No random offsets — every card shows the same physics from the same t₀.
        let phase = phaseMap.get(card) || 0
        if (exc > EXC_FLOOR || isHero) {
          const cycleDur = 3  // unified cycle — all organisms share the same kinetics
          phase += 0.016 / cycleDur
          if (phase > 1) phase -= 1
        }
        phaseMap.set(card, phase)

        // Evaluate BRET kinetic equations at current phase
        const ID = donorIntensity(phase)
        const IA = acceptorIntensity(phase)
        const IA_norm = IA * normA

        // Set excitation-weighted intensities for CSS ::before/::after opacity
        const bretD = exc * ID
        const bretA = exc * IA_norm
        card.style.setProperty('--bret-d', bretD.toFixed(4))
        card.style.setProperty('--bret-a', bretA.toFixed(4))

        // Determine species type (for channel color assignment)
        const isReversed = card.matches(REVERSED_SELECTOR)

        // ── Text color: BRET-pulsed surface luminescence ──
        // At rest, text is nearly invisible (α ≈ 0.07) — just barely perceptible.
        // The BRET pulse is what reveals the text, like bioluminescent organisms
        // that are invisible until they fire. Never removeProperty or 'initial' —
        // that triggers style recalc that flashes white.
        const DIM_FLOOR = 0.07
        const textAlpha = exc > EXC_FLOOR
          ? Math.max(Math.min(bretD + bretA, 1), DIM_FLOOR)
          : DIM_FLOOR
        card.style.setProperty('--bret-text', `rgba(${surfaceRgb},${textAlpha.toFixed(4)})`)

        // ── Text glow: dual-channel photon field (flux-gated) ──
        // The text-shadow mirrors the outline's ::before/::after box-shadow:
        // same channels, same BRET kinetics, same radii (× TEXT_SCALE).
        // This DOES pulse with the BRET cascade — it's the emitted light,
        // not the surface itself.
        //
        // CRITICAL: never removeProperty — that triggers full style recalc on
        // the card, which re-resolves var(--bret-text) and flashes white.
        // Set to 'none' instead.
        const visibleD = bretD > 0.01
        const visibleA = bretA > 0.01

        if (visibleD || visibleA) {
          const dRgb = isReversed ? accRgb : donorRgb
          const aRgb = isReversed ? donorRgb : accRgb

          const scatter = isHero ? HERO_SCATTER : 1
          const textScale = TEXT_SCALE * scatter

          const layers = []
          if (visibleD) {
            layers.push(...channelTextShadow(dRgb, bretD, DONOR_R_INNER, DONOR_R_OUTER, textScale))
          }
          if (visibleA) {
            layers.push(...channelTextShadow(aRgb, bretA, ACCEPTOR_R_INNER, ACCEPTOR_R_OUTER, textScale))
          }
          card.style.setProperty('--bret-glow', layers.join(', '))
        } else {
          card.style.setProperty('--bret-glow', 'none')
        }

        // ── Proximity gradient (non-hovered, non-hero cards only) ──
        if (isHovered || isHero) {
          if (!isHero) card.style.setProperty('--prox', '0')
          continue
        }

        const rect = card.getBoundingClientRect()
        const cx = rect.left + rect.width / 2
        const cy = rect.top + rect.height / 2
        const dx = mouseX - cx
        const dy = mouseY - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < RADIUS) {
          const prox = 1 - dist / RADIUS
          const intensity = prox * prox  // quadratic falloff

          card.style.setProperty('--prox', intensity.toFixed(3))

          // Gradient position (where cursor is relative to card)
          const nx = ((mouseX - rect.left) / rect.width * 100).toFixed(1)
          const ny = ((mouseY - rect.top) / rect.height * 100).toFixed(1)
          card.style.setProperty('--prox-x', `${nx}%`)
          card.style.setProperty('--prox-y', `${ny}%`)
        } else {
          card.style.setProperty('--prox', '0')
        }
      }
      rafRef.current = requestAnimationFrame(update)
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchcancel', onTouchEnd)
    rafRef.current = requestAnimationFrame(update)

    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchEnd)
      cancelAnimationFrame(rafRef.current)
      root.style.removeProperty('--cyan-rgb')
      root.style.removeProperty('--accent-rgb')
      root.style.removeProperty('--bret-d-r1')
      root.style.removeProperty('--bret-d-r2')
      root.style.removeProperty('--bret-a-r1')
      root.style.removeProperty('--bret-a-r2')
      root.style.removeProperty('--bret-halo-falloff')
      const cards = document.querySelectorAll(selector)
      cards.forEach(el => {
        el.style.removeProperty('--prox')
        el.style.removeProperty('--prox-x')
        el.style.removeProperty('--prox-y')
        el.style.removeProperty('--bret-d')
        el.style.removeProperty('--bret-a')
        el.style.removeProperty('--bret-text')
        el.style.removeProperty('--bret-glow')
      })
    }
  }, [active, selector])
}
