import { useMemo } from 'react'
import { formatNumber } from '../../utils'
import GGPanel from './GGPanel'
import { linearScale, categoricalScale, ggplotHue, niceTicks, useChartSize } from './scales'
import useGGHover from '../../hooks/useGGHover'

export default function GGStackExchange({ seData }) {
  const { hoveredKey, setHoveredKey, mousePos, handleMouseMove, makeTapHandler } = useGGHover()
  const { ref, width, margin, maxLabelW } = useChartSize()

  const sites = useMemo(() => seData.map(s => {
    const hostname = new URL(s.site_url).hostname
    const name = hostname.replace('.com', '').replace('.stackexchange', ' SE')

    const segments = []
    for (const q of s.questions) {
      const rep = q.up_vote_count != null
        ? q.up_vote_count * 10 - (q.down_vote_count || 0) * 2
        : q.score * 10
      if (rep > 0) {
        segments.push({
          label: q.title,
          value: rep,
          link: q.link,
          score: q.score,
          up: q.up_vote_count,
          down: q.down_vote_count,
        })
      }
    }
    for (const a of s.answers) {
      const rep = a.up_vote_count != null
        ? a.up_vote_count * 10 - (a.down_vote_count || 0) * 2 + (a.is_accepted ? 15 : 0)
        : a.score * 10
      if (rep > 0) {
        segments.push({
          label: a.question_title || 'Answer',
          value: rep,
          link: a.link,
          score: a.score,
          up: a.up_vote_count,
          down: a.down_vote_count,
          isAnswer: true,
          accepted: a.is_accepted,
        })
      }
    }

    const accounted = segments.reduce((sum, seg) => sum + seg.value, 0)
    const other = Math.max(0, s.reputation - accounted)

    return { name, reputation: s.reputation, segments, other }
  }).sort((a, b) => a.reputation - b.reputation), [seData])

  const names = sites.map(s => s.name)
  const maxRep = Math.max(...sites.map(s => s.reputation))

  const height = Math.max(200, sites.length * 45 + margin.top + margin.bottom)
  const plotW = width - margin.left - margin.right
  const plotH = height - margin.top - margin.bottom

  const xScale = linearScale([0, maxRep * 1.1], [margin.left, margin.left + plotW])
  const yScale = categoricalScale(names, [margin.top, margin.top + plotH])

  const xTickVals = niceTicks(0, maxRep * 1.1, 5)

  // Assign ggplot hue colors per segment within each site
  const allSegments = sites.flatMap(s => s.segments)
  const colorFor = (siteIdx, segIdx) => ggplotHue(Math.max(allSegments.length, 1), sites.slice(0, siteIdx).reduce((n, s) => n + s.segments.length, 0) + segIdx)

  const hoveredSeg = hoveredKey !== null
    ? sites.flatMap((s, si) => s.segments.map((seg, qi) => ({ ...seg, key: `${si}-${qi}` }))).find(s => s.key === hoveredKey)
    : null

  const tooltip = hoveredSeg ? {
    x: mousePos.x,
    y: mousePos.y,
    content: (
      <>
        <div className="gg-tooltip-title">{hoveredSeg.label}</div>
        <div className="gg-tooltip-detail">
          {hoveredSeg.isAnswer ? 'Answer' : 'Question'} · {hoveredSeg.value.toLocaleString()} rep{hoveredSeg.accepted ? ' (accepted)' : ''}
        </div>
      </>
    )
  } : null

  const barH = 24

  return (
    <div ref={ref}>
      <GGPanel
        caption={'ggplot(stack_exchange, aes(x = reputation, y = site, fill = item)) + geom_col(position = "stack") + ggtitle("Stack Exchange")'}
        width={width}
        height={height}
        margin={margin}
        maxLabelW={maxLabelW}
        xTicks={xTickVals}
        yTicks={names}
        xScale={xScale}
        yScale={yScale}
        formatX={v => formatNumber(Math.round(v))}
        formatY={v => v}
        xLabel="Reputation"
        tooltip={tooltip}
      >
        {sites.map((site, si) => {
          const y = yScale(site.name)
          let cursor = 0

          return (
            <g key={si}>
              {/* Question/answer segments */}
              {site.segments.map((seg, qi) => {
                const key = `${si}-${qi}`
                const segStart = cursor
                cursor += seg.value
                const x0 = xScale(segStart)
                const x1 = xScale(segStart + seg.value)
                const w = Math.max(x1 - x0, 2)
                return (
                  <rect
                    key={key}
                    x={x0} y={y - barH / 2}
                    width={w} height={barH}
                    fill={colorFor(si, qi)}
                    opacity={hoveredKey === null || hoveredKey === key ? 1 : 0.4}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoveredKey(key)}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={() => setHoveredKey(null)}
                    onClick={makeTapHandler(key, seg.link)}
                  />
                )
              })}
              {/* "(other)" segment */}
              {site.other > 0 && (() => {
                const x0 = xScale(cursor)
                const x1 = xScale(cursor + site.other)
                const w = Math.max(x1 - x0, 2)
                return (
                  <rect
                    x={x0} y={y - barH / 2}
                    width={w} height={barH}
                    fill="#B0B0B0"
                    opacity={hoveredKey === null ? 1 : 0.4}
                  />
                )
              })()}
            </g>
          )
        })}
      </GGPanel>
    </div>
  )
}
