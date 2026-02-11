import { useState, useRef } from 'react'
import GGPanel from './GGPanel'
import { linearScale, categoricalScale, parseMonthYear, ggplotHue, niceTicks, useChartSize } from './scales'

export default function GGExperience({ experience }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const { ref, width, margin } = useChartSize()

  const now = new Date()
  const nowVal = now.getFullYear() + now.getMonth() / 12

  const items = experience.map(e => ({
    ...e,
    startVal: parseMonthYear(e.start),
    endVal: e.current ? nowVal : parseMonthYear(e.end),
  })).filter(e => e.startVal != null && e.endVal != null)

  const orgs = [...new Set(items.map(e => e.org))]
  const colorMap = Object.fromEntries(orgs.map((o, i) => [o, ggplotHue(orgs.length, i)]))

  const roles = items.map(e => e.title).reverse()
  const allStarts = items.map(e => e.startVal)
  const allEnds = items.map(e => e.endVal)
  const minYear = Math.floor(Math.min(...allStarts))
  const maxYear = Math.ceil(Math.max(...allEnds))

  const height = Math.max(300, roles.length * 40 + margin.top + margin.bottom)

  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom

  const xScale = linearScale([minYear, maxYear], [margin.left, margin.left + plotW])
  const yScale = categoricalScale(roles, [margin.top, margin.top + plotH])

  const xTickVals = niceTicks(minYear, maxYear, 6)

  function handleMouseMove(e) {
    const svg = e.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const legend = (
    <div className="gg-legend-items">
      <span className="gg-legend-heading">org</span>
      {orgs.map(o => (
        <span key={o} className="gg-legend-item">
          <span className="gg-legend-swatch" style={{ background: colorMap[o] }}/>
          {o}
        </span>
      ))}
    </div>
  )

  const hovered = hoveredIdx !== null ? items[hoveredIdx] : null
  const tooltip = hovered ? {
    x: mousePos.x,
    y: mousePos.y,
    content: (
      <>
        <div className="gg-tooltip-title">{hovered.title}</div>
        <div className="gg-tooltip-detail">{hovered.org}</div>
        <div className="gg-tooltip-detail">{hovered.start} – {hovered.end || 'Present'}</div>
      </>
    )
  } : null

  return (
    <div ref={ref}>
      <GGPanel
        caption={'ggplot(experience, aes(x = year, y = role, fill = org)) + geom_segment() + ggtitle("Experience")'}
        width={width}
        height={height}
        margin={margin}
        xTicks={xTickVals}
        yTicks={roles}
        xScale={xScale}
        yScale={yScale}
        formatX={v => String(Math.round(v))}
        formatY={v => v}
        xLabel="Year"
        legend={legend}
        tooltip={tooltip}
      >
        {items.map((e, i) => {
          const x1 = xScale(e.startVal)
          const x2 = xScale(e.endVal)
          const y = yScale(e.title)
          const barH = 22
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'default' }}
            >
              <rect
                x={x1} y={y - barH / 2}
                width={Math.max(x2 - x1, 3)} height={barH}
                fill={colorMap[e.org]}
                rx={2}
                opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.4}
              />
            </g>
          )
        })}
      </GGPanel>
    </div>
  )
}
