import { useEffect, useRef } from 'react'

/**
 * useProximityGlow — BRET system setup + cursor proximity tracking.
 *
 * On mount:
 *   1. Reads --cyan (donor) and --accent (acceptor) from computed styles
 *   2. Computes FRET superposition colors at 50% and 90% energy transfer
 *   3. Injects --cyan-rgb, --accent-rgb, --bret-50-rgb, --bret-90-rgb,
 *      --bret-90r-rgb on :root so CSS keyframes can reference them
 *   4. Assigns Weyl-distributed phase offsets per card
 *
 * Per frame:
 *   Sets --prox/--prox-x/--prox-y on nearby cards for directional gradient.
 *   Hover glow is handled entirely by CSS BRET keyframes.
 */

const RADIUS = 400
const BRET_VARS = ['--cyan-rgb', '--accent-rgb', '--bret-50-rgb', '--bret-90-rgb', '--bret-90r-rgb']

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

export default function useProximityGlow(active, selector = '.glow-card, .kw') {
  const rafRef = useRef(null)

  useEffect(() => {
    if (!active) return

    const root = document.documentElement
    const rootStyle = getComputedStyle(root)

    // Compute BRET FRET colors from design variables
    const donor = parseColorRgb(rootStyle.getPropertyValue('--cyan').trim())
    const acceptor = parseColorRgb(rootStyle.getPropertyValue('--accent').trim())
    const fret50 = fretMix(donor, acceptor, 0.5)
    const fret90 = fretMix(donor, acceptor, 0.9)
    const fret90r = fretMix(acceptor, donor, 0.9)  // reversed species

    root.style.setProperty('--cyan-rgb', donor.join(','))
    root.style.setProperty('--accent-rgb', acceptor.join(','))
    root.style.setProperty('--bret-50-rgb', fret50.join(','))
    root.style.setProperty('--bret-90-rgb', fret90.join(','))
    root.style.setProperty('--bret-90r-rgb', fret90r.join(','))

    let mouseX = -9999
    let mouseY = -9999

    // Assign Weyl-distributed phase offsets once
    const initialCards = document.querySelectorAll(selector)
    const SQRT2 = Math.SQRT2
    initialCards.forEach((el, i) => {
      const weyl = ((i + 1) * SQRT2) % 1
      el.style.setProperty('--bio-phase', `${(-weyl * 3).toFixed(3)}s`)
      el.style.setProperty('--bio-phase-g', `${(-weyl * 8.155).toFixed(3)}s`)
    })

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
        // Hovered/touched cards: CSS BRET keyframes own all visual state.
        if (card.matches(':hover, .th')) {
          card.style.setProperty('--prox', '0')
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
      BRET_VARS.forEach(v => root.style.removeProperty(v))
      const cards = document.querySelectorAll(selector)
      cards.forEach(el => {
        el.style.removeProperty('--prox')
        el.style.removeProperty('--prox-x')
        el.style.removeProperty('--prox-y')
        el.style.removeProperty('--bio-phase')
        el.style.removeProperty('--bio-phase-g')
      })
    }
  }, [active, selector])
}
