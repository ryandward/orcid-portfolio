import { useRef, useEffect } from 'react'

export default function DnaHelix({ level = 2 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (level !== 2) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, t = 0
    const speed = 0.008  // slower, more meditative

    function resize() {
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      const w = canvas.offsetWidth, h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      const points = 48
      const amplitude = Math.min(w * 0.08, 70)
      const centerX = Math.min(w * 0.82, w - 100)
      const spacing = h / points

      for (let i = 0; i < points; i++) {
        const y = i * spacing
        const phase = i * 0.16 + t

        // Depth factor — strands fade toward edges
        const edgeFade = Math.sin((i / points) * Math.PI)

        const x1 = centerX + Math.sin(phase) * amplitude
        const x2 = centerX + Math.sin(phase + Math.PI) * amplitude
        const d1 = (Math.sin(phase) + 1) / 2
        const d2 = (Math.sin(phase + Math.PI) + 1) / 2

        // Connecting rungs (every 4th node — sparser, cleaner)
        if (i % 4 === 0) {
          ctx.beginPath()
          ctx.moveTo(x1, y)
          ctx.lineTo(x2, y)
          ctx.strokeStyle = `rgba(0,212,255,${0.025 * edgeFade})`
          ctx.lineWidth = 0.8
          ctx.stroke()
        }

        // Strand lines
        if (i > 0) {
          const py = (i - 1) * spacing
          const prevPhase = (i - 1) * 0.16 + t

          // Cyan strand
          ctx.beginPath()
          ctx.moveTo(centerX + Math.sin(prevPhase) * amplitude, py)
          ctx.lineTo(x1, y)
          ctx.strokeStyle = `rgba(0,212,255,${(0.04 + d1 * 0.06) * edgeFade})`
          ctx.lineWidth = 1.2
          ctx.stroke()

          // Green strand
          ctx.beginPath()
          ctx.moveTo(centerX + Math.sin(prevPhase + Math.PI) * amplitude, py)
          ctx.lineTo(x2, y)
          ctx.strokeStyle = `rgba(0,255,136,${(0.03 + d2 * 0.05) * edgeFade})`
          ctx.lineWidth = 1.2
          ctx.stroke()
        }

        // Node dots with soft glow
        const r1 = 1.5 + d1 * 1.2
        const r2 = 1.5 + d2 * 1.2

        // Green node
        ctx.beginPath()
        ctx.arc(x1, y, r1, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,255,136,${(0.08 + d1 * 0.18) * edgeFade})`
        ctx.fill()

        // Cyan node
        ctx.beginPath()
        ctx.arc(x2, y, r2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0,212,255,${(0.06 + d2 * 0.15) * edgeFade})`
        ctx.fill()

        // Subtle halo on brighter nodes
        if (d1 > 0.7 && edgeFade > 0.5) {
          const glow = ctx.createRadialGradient(x1, y, r1 * 0.5, x1, y, r1 * 5)
          glow.addColorStop(0, `rgba(0,255,136,${0.06 * edgeFade})`)
          glow.addColorStop(1, 'rgba(0,255,136,0)')
          ctx.beginPath()
          ctx.arc(x1, y, r1 * 5, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
        }
        if (d2 > 0.7 && edgeFade > 0.5) {
          const glow = ctx.createRadialGradient(x2, y, r2 * 0.5, x2, y, r2 * 5)
          glow.addColorStop(0, `rgba(0,212,255,${0.05 * edgeFade})`)
          glow.addColorStop(1, 'rgba(0,212,255,0)')
          ctx.beginPath()
          ctx.arc(x2, y, r2 * 5, 0, Math.PI * 2)
          ctx.fillStyle = glow
          ctx.fill()
        }
      }

      t += speed
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [level])

  return (
    <canvas
      ref={canvasRef}
      className="dna-canvas"
      style={level === 1 ? { opacity: 0 } : undefined}
    />
  )
}
