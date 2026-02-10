import { useRef, useCallback } from 'react'

export default function GlowCard({ children, className = '', href, onClick }) {
  const cardRef = useRef(null)
  const handleMouse = useCallback((e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    card.style.setProperty('--glow-x', `${x}px`)
    card.style.setProperty('--glow-y', `${y}px`)
  }, [])

  const Tag = href ? 'a' : 'div'
  const extraProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Tag ref={cardRef} className={`glow-card ${className}`}
      onMouseMove={handleMouse} onClick={onClick} {...extraProps}>
      {children}
    </Tag>
  )
}
