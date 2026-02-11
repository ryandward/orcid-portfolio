import { useState } from 'react'
import GGPanel from './GGPanel'
import { linearScale, categoricalScale, ggplotHue, niceTicks, useChartSize } from './scales'

// ggplot2-style point shapes (SVG paths centered on 0,0)
const SHAPES = [
  // circle (default)
  (cx, cy, r) => <circle cx={cx} cy={cy} r={r}/>,
  // triangle
  (cx, cy, r) => <polygon points={`${cx},${cy - r} ${cx - r},${cy + r * 0.7} ${cx + r},${cy + r * 0.7}`}/>,
  // square
  (cx, cy, r) => <rect x={cx - r * 0.8} y={cy - r * 0.8} width={r * 1.6} height={r * 1.6}/>,
  // diamond
  (cx, cy, r) => <polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}/>,
  // plus
  (cx, cy, r) => <path d={`M${cx - r},${cy} L${cx + r},${cy} M${cx},${cy - r} L${cx},${cy + r}`} strokeWidth={3}/>,
]

export default function GGEducation({ educations }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const { ref, width, margin } = useChartSize()

  const items = educations.map(e => {
    const year = parseInt(e['end-date']?.year?.value || e['start-date']?.year?.value) || 0
    const role = e['role-title'] || e['department-name'] || 'Student'
    const org = e.organization?.name || ''
    return { year, role, org, label: `${role}` }
  }).filter(e => e.year > 0)

  const labels = items.map(e => e.label).reverse()
  const degrees = [...new Set(items.map(e => e.role))]
  const orgs = [...new Set(items.map(e => e.org))]
  const colorMap = Object.fromEntries(degrees.map((d, i) => [d, ggplotHue(degrees.length, i)]))
  const shapeMap = Object.fromEntries(orgs.map((o, i) => [o, i % SHAPES.length]))

  const years = items.map(e => e.year)
  const minYear = Math.min(...years) - 2
  const maxYear = Math.max(...years) + 2

  const height = Math.max(180, labels.length * 50 + margin.top + margin.bottom)
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom

  const xScale = linearScale([minYear, maxYear], [margin.left, margin.left + plotW])
  const yScale = categoricalScale(labels, [margin.top, margin.top + plotH])

  const xTickVals = niceTicks(minYear, maxYear, 6)

  function handleMouseMove(e) {
    const svg = e.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const legend = (
    <div className="gg-legend-rows">
      <div className="gg-legend-items">
        <span className="gg-legend-heading">Degree</span>
        {degrees.map(d => (
          <span key={d} className="gg-legend-item">
            <span className="gg-legend-swatch" style={{ background: colorMap[d], borderRadius: '50%' }}/>
            {d}
          </span>
        ))}
      </div>
      <div className="gg-legend-items">
        <span className="gg-legend-heading">Institution</span>
        {orgs.map(o => (
          <span key={o} className="gg-legend-item">
            <svg width="14" height="14" viewBox="-8 -8 16 16" className="gg-legend-shape">
              {SHAPES[shapeMap[o]](0, 0, 6)}
            </svg>
            {o}
          </span>
        ))}
      </div>
    </div>
  )

  const hovered = hoveredIdx !== null ? items[hoveredIdx] : null
  const tooltip = hovered ? {
    x: mousePos.x,
    y: mousePos.y,
    content: (
      <>
        <div className="gg-tooltip-title">{hovered.role}</div>
        <div className="gg-tooltip-detail">{hovered.org}</div>
        <div className="gg-tooltip-detail">{hovered.year}</div>
      </>
    )
  } : null

  return (
    <div ref={ref}>
      <GGPanel
        caption={'ggplot(education, aes(x = year, y = degree, color = degree, shape = institution)) + geom_point(size = 4) + ggtitle("Education")'}
        width={width}
        height={height}
        margin={margin}
        xTicks={xTickVals}
        yTicks={labels}
        xScale={xScale}
        yScale={yScale}
        formatX={v => String(Math.round(v))}
        formatY={v => v}
        xLabel="Year"
        legend={legend}
        tooltip={tooltip}
      >
        {items.map((e, i) => {
          const cx = xScale(e.year)
          const cy = yScale(e.label)
          const color = colorMap[e.role]
          const shapeIdx = shapeMap[e.org]
          const shapeFn = SHAPES[shapeIdx]
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredIdx(null)}
              fill={color}
              stroke={color}
              opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.4}
            >
              {/* lollipop stem */}
              <line
                x1={margin.left} x2={cx}
                y1={cy} y2={cy}
                stroke={color}
                strokeWidth={2}
                strokeDasharray="4,3"
                opacity={hoveredIdx === null || hoveredIdx === i ? 0.5 : 0.15}
              />
              {/* degree point — shape encodes institution */}
              <g>
                {shapeFn(cx, cy, 8)}
              </g>
            </g>
          )
        })}
      </GGPanel>
    </div>
  )
}
