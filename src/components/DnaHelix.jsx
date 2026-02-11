import { useRef, useEffect } from 'react'

export default function DnaHelix({ level = 2 }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (level !== 2) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, t = 0
    const speed = 0.012
    const alphaMult = 1
    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)
    function draw() {
      const w = canvas.offsetWidth, h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      const points = 50, amplitude = Math.min(w * 0.1, 90), centerX = Math.min(w * 0.85, w - 120), spacing = h / points
      for (let i = 0; i < points; i++) {
        const y = i * spacing, phase = (i * 0.18) + t
        const x1 = centerX + Math.sin(phase) * amplitude
        const x2 = centerX + Math.sin(phase + Math.PI) * amplitude
        const d1 = (Math.sin(phase) + 1) / 2, d2 = (Math.sin(phase + Math.PI) + 1) / 2
        if (i % 3 === 0) {
          ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y)
          ctx.strokeStyle = `rgba(0,255,136,${(0.03 + d1 * 0.05) * alphaMult})`; ctx.lineWidth = 1; ctx.stroke()
        }
        if (i > 0) {
          const py = (i-1)*spacing
          ctx.beginPath(); ctx.moveTo(centerX + Math.sin(((i-1)*0.18)+t)*amplitude, py); ctx.lineTo(x1, y)
          ctx.strokeStyle = `rgba(0,255,136,${(0.06 + d1*0.12) * alphaMult})`; ctx.lineWidth = 1.5; ctx.stroke()
          ctx.beginPath(); ctx.moveTo(centerX + Math.sin(((i-1)*0.18)+t+Math.PI)*amplitude, py); ctx.lineTo(x2, y)
          ctx.strokeStyle = `rgba(0,212,255,${(0.04 + d2*0.1) * alphaMult})`; ctx.lineWidth = 1.5; ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(x1, y, 2+d1*1.5, 0, Math.PI*2)
        ctx.fillStyle = `rgba(0,255,136,${(0.12+d1*0.3) * alphaMult})`; ctx.fill()
        ctx.beginPath(); ctx.arc(x2, y, 2+d2*1.5, 0, Math.PI*2)
        ctx.fillStyle = `rgba(0,212,255,${(0.1+d2*0.25) * alphaMult})`; ctx.fill()
      }
      t += speed; animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [level])
  return <canvas ref={canvasRef} className="dna-canvas" style={level === 1 ? { opacity: 0 } : undefined}/>
}
