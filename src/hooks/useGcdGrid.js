import { useRef, useState, useEffect } from 'react'

/**
 * useGcdGrid — GCD-smart responsive grid.
 *
 * Observes a container's width and picks the largest factor of its
 * child count that fits (given a minimum item width). Only factor-
 * friendly column counts are used, so rows always fill evenly.
 *
 * Returns [ref, cols] — attach ref to the container, cols is the
 * computed column count (null until first measurement).
 */
export default function useGcdGrid(minItemWidth = 140, gap = 12, dep) {
  const ref = useRef(null)
  const [cols, setCols] = useState(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const n = el.childElementCount
    if (n <= 1) { setCols(1); return }

    const factors = []
    for (let c = n; c >= 1; c--) {
      if (n % c === 0) factors.push(c)
    }

    const observer = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      setCols(factors.find(f => f * minItemWidth + (f - 1) * gap <= w) || 1)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [dep, minItemWidth, gap])

  return [ref, cols]
}
