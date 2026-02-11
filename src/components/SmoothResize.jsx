import { useRef, useState, useEffect } from 'react'

export default function SmoothResize({ children, className, style }) {
  const innerRef = useRef(null)
  const [h, setH] = useState(undefined)

  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => setH(Math.round(entry.contentRect.height)))
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      className={className}
      style={{ ...style, height: h, transition: 'height 0.35s ease', overflow: 'hidden' }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  )
}
