import { useState, useEffect } from 'react'
import { useReveal } from '../hooks/useReveal'

export default function CountUp({ target, duration = 1200 }) {
  const [val, setVal] = useState(0)
  const [ref, visible] = useReveal(0.5)
  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = Math.max(1, Math.floor(duration / target))
    const timer = setInterval(() => {
      start++; setVal(start)
      if (start >= target) clearInterval(timer)
    }, step)
    return () => clearInterval(timer)
  }, [visible, target, duration])
  return <span ref={ref}>{val}</span>
}
