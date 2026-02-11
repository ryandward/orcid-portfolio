import { useRef, useEffect, useCallback } from 'react'

/**
 * BiolumField — two-layer bioluminescence system for detail level 2.
 *
 * Layer 1: Ambient spore particles — tiny drifting motes with individual
 * luminescence cycles (Michaelis-Menten–inspired fast-rise / slow-decay).
 * Each spore has its own phase, drift vector, and color temperature.
 *
 * Layer 2: Mouse proximity field — a soft radial glow follows the cursor
 * across the entire page, and spores within range brighten and drift toward
 * the disturbance, like dinoflagellates reacting to mechanical shear.
 */

const SPORE_COUNT = 150
const PROXIMITY_RADIUS = 280
const CURSOR_GLOW_RADIUS = 220

// Fast enzymatic rise, slow product-inhibited decay (asymmetric pulse)
function enzymePulse(phase) {
  const t = ((phase % 1) + 1) % 1
  if (t < 0.12) return t / 0.12                        // rapid substrate binding
  if (t < 0.25) return 1.0 - (t - 0.12) * 0.3 / 0.13  // brief plateau + initial decay
  return Math.max(0, 0.7 * Math.exp(-3.5 * (t - 0.25)))  // exponential product inhibition
}

export default function BiolumField({ active }) {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -9999, y: -9999, active: false })
  const sporesRef = useRef(null)
  const frameRef = useRef(0)
  const timeRef = useRef(0)

  // Initialize spores with individual metabolic parameters
  const initSpores = useCallback((w, h) => {
    const spores = []
    for (let i = 0; i < SPORE_COUNT; i++) {
      const golden = (i * 0.618033988749895) % 1
      spores.push({
        x: Math.random() * w,
        y: Math.random() * h,
        baseX: 0, baseY: 0,  // will be set to initial position
        vx: (Math.random() - 0.5) * 0.08,
        vy: -0.02 - Math.random() * 0.04,  // very gentle upward drift
        radius: 1.2 + Math.random() * 2.0,
        // Individual metabolic rate — Weyl-distributed periods
        period: 4 + golden * 6,
        phase: Math.random(),
        // Color temperature: 0 = pure cyan (480nm), 1 = pure green (509nm)
        temp: Math.random(),
        // Intensity ceiling — some organisms are dimmer
        maxAlpha: 0.15 + Math.random() * 0.35,
        // Proximity excitation (will be updated each frame)
        excitation: 0,
      })
    }
    sporesRef.current = spores
  }, [])

  useEffect(() => {
    if (!active) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    const dpr = window.devicePixelRatio || 1

    function resize() {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (!sporesRef.current) initSpores(rect.width, rect.height)
    }
    resize()
    window.addEventListener('resize', resize)

    // Track mouse position relative to canvas
    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      }
    }
    function onMouseLeave() {
      mouseRef.current = { ...mouseRef.current, active: false }
    }

    // Listen on document so the field responds to cursor anywhere on page
    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)

    function draw() {
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      const mouse = mouseRef.current
      timeRef.current += 0.016  // ~60fps timestep

      ctx.clearRect(0, 0, w, h)

      // No cursor glow — proximity is expressed through spore excitation only

      // Layer 2: Spore particles
      const spores = sporesRef.current
      if (!spores) { animId = requestAnimationFrame(draw); return }

      for (const s of spores) {
        // Advance phase
        s.phase += 0.016 / s.period

        // Base luminescence from enzymatic pulse
        const baseLum = enzymePulse(s.phase) * s.maxAlpha

        // Proximity excitation — mechanical shear from cursor
        let excite = 0
        if (mouse.active) {
          const dx = s.x - mouse.x
          const dy = s.y - mouse.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < PROXIMITY_RADIUS) {
            excite = 1 - dist / PROXIMITY_RADIUS
            excite = excite * excite * 0.8  // quadratic falloff

            // Gentle attraction — spores drift toward disturbance like
            // dinoflagellates drawn to mechanical shear in the water
            const angle = Math.atan2(dy, dx)
            s.vx -= Math.cos(angle) * excite * 0.015
            s.vy -= Math.sin(angle) * excite * 0.015
          }
        }

        // Smooth excitation (don't snap)
        s.excitation += (excite - s.excitation) * 0.08

        // Update position with drift + damping
        s.x += s.vx
        s.y += s.vy
        s.vx *= 0.995
        s.vy *= 0.995

        // Wrap around edges with padding
        if (s.x < -20) s.x = w + 20
        if (s.x > w + 20) s.x = -20
        if (s.y < -20) s.y = h + 20
        if (s.y > h + 20) s.y = -20

        // Restore gentle upward drift
        s.vy += (-0.03 - s.vy) * 0.001

        // Composite luminescence — excited spores glow much brighter
        const lum = Math.min(1, baseLum + s.excitation * 0.8)
        if (lum < 0.01) continue  // skip invisible spores

        // Color: lerp between cyan and green based on temperature
        const r = 0
        const g = Math.round(212 + s.temp * 43)  // 212 → 255
        const b = Math.round(255 - s.temp * 119)  // 255 → 136
        const alpha = lum

        // Inner bright core
        const coreR = s.radius * (0.6 + s.excitation * 0.4)
        ctx.beginPath()
        ctx.arc(s.x, s.y, coreR, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.fill()

        // Outer glow halo (larger, much softer)
        if (lum > 0.05) {
          const glowR = s.radius * (3 + s.excitation * 4)
          const glow = ctx.createRadialGradient(s.x, s.y, coreR * 0.5, s.x, s.y, glowR)
          glow.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.3})`)
          glow.addColorStop(1, `rgba(${r},${g},${b},0)`)
          ctx.beginPath()
          ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
        }
      }

      animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [active, initSpores])

  return (
    <canvas
      ref={canvasRef}
      className="biolum-canvas"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
        opacity: active ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }}
    />
  )
}
