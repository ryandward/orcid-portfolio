import { useEffect, useRef } from 'react'

/**
 * useProximityGlow — makes cards glow based on cursor proximity, not just hover.
 *
 * For each card matching `selector`, computes distance from cursor to card center.
 * Cards within `radius` get:
 *   --prox (0–1) for CSS to drive gradient opacity
 *   --prox-x, --prox-y for directional gradient position
 *   Inline box-shadow and border-color that smoothly interpolate with distance
 *
 * Phase offsets are Weyl-distributed via frac(n·√2) so no two cards pulse alike.
 */

const RADIUS = 500

export default function useProximityGlow(active, selector = '.glow-card, .kw') {
  const rafRef = useRef(null)

  useEffect(() => {
    if (!active) return

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

          // Proximity-driven border and shadow — subtle, not a spotlight
          const cyanAlpha = (intensity * 0.10).toFixed(3)
          const shadowSpread = (intensity * 12).toFixed(1)
          const shadowSpread2 = (intensity * 20).toFixed(1)

          card.style.borderColor = `rgba(0,212,255,${cyanAlpha})`
          card.style.boxShadow = `0 0 ${shadowSpread}px rgba(0,212,255,${(intensity * 0.03).toFixed(3)}), 0 0 ${shadowSpread2}px rgba(0,255,136,${(intensity * 0.015).toFixed(3)})`
        } else {
          card.style.setProperty('--prox', '0')
          card.style.borderColor = ''
          card.style.boxShadow = ''
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
      const cards = document.querySelectorAll(selector)
      cards.forEach(el => {
        el.style.removeProperty('--prox')
        el.style.removeProperty('--prox-x')
        el.style.removeProperty('--prox-y')
        el.style.removeProperty('--bio-phase')
        el.style.removeProperty('--bio-phase-g')
        el.style.borderColor = ''
        el.style.boxShadow = ''
      })
    }
  }, [active, selector])
}
