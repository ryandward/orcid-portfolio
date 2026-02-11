import { useEffect, useRef } from 'react'

/**
 * useProximityGlow — per-frame BRET temporal dynamics + enzyme-kinetic excitation.
 *
 * Every frame, for each card:
 *   1. Enzyme kinetics drive --excitation (0→1):
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
 *        --bret-color = composite FRET color RGB  (luminance-weighted donor+acceptor mix)
 *
 *   5. CSS uses these directly:
 *        ::before  opacity = var(--bret-d)  →  donor emission channel
 *        ::after   opacity = var(--bret-a)  →  acceptor emission channel
 *        text      color = rgb(var(--bret-color))
 *
 * BRET model: dual-exponential cascade (A→B→C kinetics)
 *   Donor decays as single exponential after substrate trigger at t₀.
 *   Acceptor follows the classic two-state cascade: rises as donor
 *   transfers energy (rate k_D), then decays with its own lifetime (rate k_A).
 *   At any instant, both channels are independently visible — their additive
 *   overlap IS the bioluminescence resonance energy transfer.
 *
 * Phase: resets to 0 on each new hover — the substrate binding event (t₀)
 * IS the hover. Every card shows the full emission cascade from the start.
 */

const RADIUS = 400

// Enzyme kinetics rate constants (per frame at ~60fps)
const K_BIND = 0.08    // substrate binding rate (rise τ ≈ 0.21s)
const K_RELEASE = 0.97  // product release damping (decay τ ≈ 0.55s)
const EXC_FLOOR = 0.005 // below this, snap to 0

// BRET temporal dynamics (phase ∈ [0,1] maps to one full cycle)
const EPS_FRET = 0.5   // FRET efficiency (Förster radius ≈ intermolecular distance)
const TAU_D = 0.06      // donor luminescence lifetime (6% of cycle)
const TAU_A = 0.20      // acceptor emission lifetime (20% of cycle)
const T0 = 0.03         // trigger time — substrate binding event (3% of cycle)

const K_D = 1 / TAU_D   // donor decay rate (16.67)
const K_A = 1 / TAU_A   // acceptor decay rate (5.0)

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

    root.style.setProperty('--cyan-rgb', donor.join(','))
    root.style.setProperty('--accent-rgb', acceptor.join(','))

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
          exc = 1  // hero is always fully excited
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

        // Composite FRET color (luminance-weighted superposition at current instant)
        const total = ID + IA_norm
        const epsEff = total > 0 ? IA_norm / total : 0
        const isReversed = card.matches('.se-card')
        const composite = isReversed
          ? fretMix(acceptor, donor, epsEff)
          : fretMix(donor, acceptor, epsEff)
        card.style.setProperty('--bret-color', composite.join(','))

        // Complete text color + text-shadow as CSS custom properties.
        // When excitation drops to 0, these are removed so CSS var() becomes
        // invalid → declaration ignored → base text color shows through.
        const textAlpha = Math.max(bretD, bretA)
        if (textAlpha > 0.01) {
          const c = composite.join(',')
          const a = Math.min(1, textAlpha * (isHero ? 2.5 : 1))
          const r1 = isHero ? 24 : 8   // inner glow radius (hero = 3× card)
          const r2 = isHero ? 60 : 20  // outer glow radius
          card.style.setProperty('--bret-text', `rgba(${c},${a.toFixed(3)})`)
          card.style.setProperty('--bret-glow',
            `0 0 ${r1}px rgba(${c},${a.toFixed(3)}), 0 0 ${r2}px rgba(${c},${(a * 0.5).toFixed(3)})`)
        } else {
          card.style.removeProperty('--bret-text')
          card.style.removeProperty('--bret-glow')
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
      const cards = document.querySelectorAll(selector)
      cards.forEach(el => {
        el.style.removeProperty('--prox')
        el.style.removeProperty('--prox-x')
        el.style.removeProperty('--prox-y')
        el.style.removeProperty('--bret-d')
        el.style.removeProperty('--bret-a')
        el.style.removeProperty('--bret-color')
        el.style.removeProperty('--bret-text')
        el.style.removeProperty('--bret-glow')
      })
    }
  }, [active, selector])
}
