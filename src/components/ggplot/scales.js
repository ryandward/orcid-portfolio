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
