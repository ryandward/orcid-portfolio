import { useState, useRef } from 'react'
import { cleanType, getDoiUrl, workYear, fixTitle } from '../../utils'
import GGPanel from './GGPanel'
import { linearScale, ggplotHue, niceTicks, useChartSize } from './scales'

export default function GGPublications({ works }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const tappedRef = useRef(null)
  const { ref, width, margin, maxLabelW } = useChartSize()

  const items = works.map(w => ({
    year: parseInt(workYear(w)) || 0,
    type: cleanType(w.type) || 'other',
    title: fixTitle(w.title?.title?.value) || 'Untitled',
    journal: w['journal-title']?.value || '',
    doi: getDoiUrl(w['external-ids']),
  })).filter(w => w.year > 0)

  // Stack dots by year
  const yearGroups = {}
  items.forEach((item, i) => {
    if (!yearGroups[item.year]) yearGroups[item.year] = []
    yearGroups[item.year].push({ ...item, originalIdx: i })
  })

  const types = [...new Set(items.map(w => w.type))]
  const colorMap = Object.fromEntries(types.map((t, i) => [t, ggplotHue(types.length, i)]))

  const years = items.map(w => w.year)
  const minYear = Math.min(...years) - 1
  const maxYear = Math.max(...years) + 1
  const maxStack = Math.max(...Object.values(yearGroups).map(g => g.length))

  const height = Math.max(300, maxStack * 28 + margin.top + margin.bottom)
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom

  const xScale = linearScale([minYear, maxYear], [margin.left, margin.left + plotW])
  const yScale = linearScale([0, maxStack + 1], [margin.top + plotH, margin.top])

  const xTickVals = niceTicks(minYear, maxYear, 8)
  const yTickVals = niceTicks(0, maxStack + 1, 5).filter(v => v >= 0)

  function handleMouseMove(e) {
    const svg = e.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const legend = (
    <div className="gg-legend-items">
      <span className="gg-legend-heading">type</span>
      {types.map(t => (
        <span key={t} className="gg-legend-item">
          <span className="gg-legend-swatch" style={{ background: colorMap[t], borderRadius: '50%' }}/>
          {t}
        </span>
      ))}
    </div>
  )

  const dots = []
  Object.entries(yearGroups).forEach(([year, group]) => {
    group.forEach((item, stackIdx) => {
      dots.push({ ...item, year: parseInt(year), stackIdx: stackIdx + 1 })
    })
  })

  const hovered = hoveredIdx !== null ? dots[hoveredIdx] : null
  const tooltip = hovered ? {
    x: mousePos.x,
    y: mousePos.y,
    content: (
      <>
        <div className="gg-tooltip-title">{hovered.title}</div>
        {hovered.journal && <div className="gg-tooltip-detail">{hovered.journal}</div>}
        <div className="gg-tooltip-detail">{hovered.year} &middot; {hovered.type}</div>
      </>
    )
  } : null

  return (
    <div ref={ref}>
      <GGPanel
        caption={'ggplot(works, aes(x = year, fill = type)) + geom_dotplot() + ggtitle("Publications")'}
        width={width}
        height={height}
        margin={margin}
        maxLabelW={maxLabelW}
        xTicks={xTickVals}
        yTicks={yTickVals}
        xScale={xScale}
        yScale={yScale}
        formatX={v => String(Math.round(v))}
        formatY={v => String(Math.round(v))}
        xLabel="Publication Year"
        yLabel="Count"
        legend={legend}
        tooltip={tooltip}
      >
        {dots.map((d, i) => {
          const cx = xScale(d.year)
          const cy = yScale(d.stackIdx)
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={(e) => {
                if (!d.doi) return
                if ('ontouchstart' in window && tappedRef.current !== i) {
                  e.preventDefault()
                  tappedRef.current = i
                  setHoveredIdx(i)
                  const svg = e.currentTarget.closest('svg')
                  if (svg) {
                    const rect = svg.getBoundingClientRect()
                    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                  }
                  return
                }
                window.open(d.doi, '_blank', 'noopener')
              }}
              style={{ cursor: d.doi ? 'pointer' : 'default' }}
            >
              <circle
                cx={cx} cy={cy} r={10}
                fill={colorMap[d.type]}
                opacity={hoveredIdx === null || hoveredIdx === i ? 0.85 : 0.35}
                stroke={hoveredIdx === i ? '#000' : 'none'}
                strokeWidth={1.5}
              />
            </g>
          )
        })}
      </GGPanel>
    </div>
  )
}
