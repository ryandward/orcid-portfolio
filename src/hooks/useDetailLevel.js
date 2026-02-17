import { useState, useEffect, useLayoutEffect, useRef } from 'react'

export default function useDetailLevel(initial) {
  const [detailLevel, setDetailLevel] = useState(initial)
  const [toast, setToast] = useState(null)

  useLayoutEffect(() => {
    document.body.className = `detail-${detailLevel}`
  }, [detailLevel])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const n = parseInt(e.key)
      if (n >= 1 && n <= 4) setDetailLevel(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const didMount = useRef(false)
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return }
    const labels = { 1: 'css: unloaded', 2: 'detail: normal', 3: 'EDITORIAL MODE', 4: 'ggplot(my_resume)' }
    setToast(labels[detailLevel])
    const id = setTimeout(() => setToast(null), 1500)
    return () => clearTimeout(id)
  }, [detailLevel])

  return { detailLevel, setDetailLevel, toast }
}
