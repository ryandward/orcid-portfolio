import { useState, useRef, useCallback } from 'react'

export default function useGGHover() {
  const [hoveredKey, setHoveredKey] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const tappedRef = useRef(null)

  const handleMouseMove = useCallback((e) => {
    const svg = e.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const makeTapHandler = useCallback((key, url) => (e) => {
    if (!url) return
    if ('ontouchstart' in window && tappedRef.current !== key) {
      e.preventDefault()
      tappedRef.current = key
      setHoveredKey(key)
      const svg = e.currentTarget.closest('svg')
      if (svg) {
        const rect = svg.getBoundingClientRect()
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }
      return
    }
    window.open(url, '_blank', 'noopener')
  }, [])

  return { hoveredKey, setHoveredKey, mousePos, handleMouseMove, makeTapHandler }
}
