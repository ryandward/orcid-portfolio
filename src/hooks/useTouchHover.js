import { useEffect } from 'react'

export default function useTouchHover(detailLevel) {
  useEffect(() => {
    if (detailLevel < 2) return
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (!isTouch) return

    function handleClick(e) {
      const el = e.target.closest('.snake-card, .pub-card, .se-card, .kw, .lnk')
      document.querySelectorAll('.th').forEach(node => {
        if (node !== el) node.classList.remove('th')
      })
      if (!el) return
      if (el.classList.contains('th')) {
        el.classList.remove('th')
        return
      }
      e.preventDefault()
      el.classList.add('th')
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      document.querySelectorAll('.th').forEach(n => n.classList.remove('th'))
    }
  }, [detailLevel])
}
