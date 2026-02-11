import { useState, useEffect, useRef } from 'react'

export function useChartSize(baseWidth = 800, baseMargin = { top: 10, right: 30, bottom: 50, left: 160 }) {
  const ref = useRef(null)
  const [containerW, setContainerW] = useState(baseWidth)

  useEffect(() => {
    if (!ref.current) return
    const obs = new ResizeObserver(([e]) => setContainerW(e.contentRect.width))
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const width = Math.min(baseWidth, Math.max(containerW, 300))
  const ratio = width / baseWidth
  const margin = {
    top: baseMargin.top,
    right: Math.round(baseMargin.right * ratio),
    bottom: baseMargin.bottom,
    left: Math.round(baseMargin.left * ratio),
  }

  return { ref, width, margin }
}

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

export function linearScale([d0, d1], [r0, r1]) {
  return v => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0)
}

export function categoricalScale(labels, [r0, r1]) {
  const step = (r1 - r0) / (labels.length || 1)
  return label => {
    const i = labels.indexOf(label)
    return r0 + step * i + step / 2
  }
}

export function parseMonthYear(str) {
  if (!str) return null
  const parts = str.toLowerCase().split(/\s+/)
  if (parts.length < 2) return parseInt(parts[0]) || null
  const m = MONTHS[parts[0].slice(0, 3)]
  const y = parseInt(parts[1])
  if (m == null || isNaN(y)) return null
  return y + m / 12
}

export function ggplotHue(n, i) {
  const h = (15 + (360 / n) * i) % 360
  return `hsl(${h}, 65%, 55%)`
}

export function niceTicks(min, max, count = 5) {
  const range = max - min
  const rough = range / count
  const mag = Math.pow(10, Math.floor(Math.log10(rough)))
  const residual = rough / mag
  let nice
  if (residual <= 1.5) nice = 1
  else if (residual <= 3) nice = 2
  else if (residual <= 7) nice = 5
  else nice = 10
  const step = nice * mag
  const start = Math.ceil(min / step) * step
  const ticks = []
  for (let v = start; v <= max; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6)
  }
  return ticks
}
