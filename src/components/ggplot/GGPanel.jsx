function truncate(text, maxPx, fontSize = 10) {
  const charW = fontSize * 0.58
  const maxChars = Math.floor(maxPx / charW)
  if (String(text).length <= maxChars) return String(text)
  return String(text).slice(0, Math.max(1, maxChars - 1)) + '\u2026'
}

export default function GGPanel({
  caption,
  width = 800,
  height = 400,
  margin = { top: 10, right: 30, bottom: 50, left: 160 },
  maxLabelW,
  xTicks = [],
  yTicks = [],
  xLabel,
  yLabel,
  formatX = v => v,
  formatY = v => v,
  xScale,
  yScale,
  children,
  legend,
  tooltip,
}) {
  // Extract title from ggtitle() in caption
  const titleMatch = caption?.match(/ggtitle\(["'](.+?)["']\)/)
  const plotTitle = titleMatch ? titleMatch[1] : null

  // Add extra top margin for title
  const titleH = plotTitle ? 22 : 0
  const effectiveMarginTop = margin.top + titleH
  const totalHeight = height + titleH

  const plotW = width - margin.left - margin.right
  const plotH = totalHeight - effectiveMarginTop - margin.bottom

  return (
    <div className="gg-panel" style={{ position: 'relative' }}>
      {caption && (() => {
        const parts = caption.split(' +')
        return (
          <div className="gg-terminal">
            {parts.map((part, i) => (
              <div key={i} className="gg-term-line">
                <span className="gg-term-prompt">{i === 0 ? '> ' : '  '}</span>
                <span className="gg-term-code">{i === 0 ? part.trim() : '+ ' + part.trim()}</span>
              </div>
            ))}
          </div>
        )
      })()}
      <div style={{ position: 'relative' }}>
        <svg
          viewBox={`0 0 ${width} ${totalHeight}`}
          width="100%"
          style={{ display: 'block' }}
        >
          {/* plot title (ggtitle) */}
          {plotTitle && (
            <text x={margin.left} y={margin.top + 14}
              className="gg-plot-title">{plotTitle}</text>
          )}

          {/* panel background */}
          <rect
            x={margin.left} y={effectiveMarginTop}
            width={plotW} height={plotH}
            fill="#EBEBEB"
          />

          {/* horizontal gridlines */}
          {yTicks.map((t, i) => {
            const y = yScale ? yScale(t) + titleH : 0
            return (
              <line key={`yg-${i}`}
                x1={margin.left} x2={margin.left + plotW}
                y1={y} y2={y}
                stroke="#FFFFFF" strokeWidth={1}
              />
            )
          })}

          {/* vertical gridlines */}
          {xTicks.map((t, i) => {
            const x = xScale ? xScale(t) : 0
            return (
              <line key={`xg-${i}`}
                x1={x} x2={x}
                y1={effectiveMarginTop} y2={effectiveMarginTop + plotH}
                stroke="#FFFFFF" strokeWidth={1}
              />
            )
          })}

          {/* plot content — offset by titleH */}
          <g transform={`translate(0, ${titleH})`}>
            {children}
          </g>

          {/* panel border — all four sides */}
          <rect
            x={margin.left} y={effectiveMarginTop}
            width={plotW} height={plotH}
            fill="none" stroke="#4D4D4D" strokeWidth={1}
          />

          {/* x-axis ticks + labels */}
          {xTicks.map((t, i) => {
            const x = xScale ? xScale(t) : 0
            return (
              <g key={`xt-${i}`}>
                <line x1={x} x2={x} y1={effectiveMarginTop + plotH} y2={effectiveMarginTop + plotH + 5} stroke="#4D4D4D"/>
                <text x={x} y={effectiveMarginTop + plotH + 18} textAnchor="middle"
                  className="gg-axis-label">{formatX(t)}</text>
              </g>
            )
          })}

          {/* y-axis ticks + labels */}
          {yTicks.map((t, i) => {
            const y = yScale ? yScale(t) + titleH : 0
            const full = formatY(t)
            const display = maxLabelW ? truncate(full, maxLabelW) : full
            return (
              <g key={`yt-${i}`}>
                <line x1={margin.left - 5} x2={margin.left} y1={y} y2={y} stroke="#4D4D4D"/>
                <text x={margin.left - 10} y={y} textAnchor="end" dominantBaseline="central"
                  className="gg-axis-label">
                  {display !== full && <title>{full}</title>}
                  {display}
                </text>
              </g>
            )
          })}

          {/* axis titles */}
          {xLabel && (
            <text x={margin.left + plotW / 2} y={totalHeight - 5} textAnchor="middle"
              className="gg-axis-title">{xLabel}</text>
          )}
          {yLabel && (
            <text x={margin.left - 40} y={effectiveMarginTop + plotH / 2} textAnchor="middle"
              className="gg-axis-title" transform={`rotate(-90, ${margin.left - 40}, ${effectiveMarginTop + plotH / 2})`}>{yLabel}</text>
          )}
        </svg>
        {tooltip && (
          <div className="gg-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
            {tooltip.content}
          </div>
        )}
      </div>
      {legend && <div className="gg-legend">{legend}</div>}
    </div>
  )
}
