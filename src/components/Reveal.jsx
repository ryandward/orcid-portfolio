import { useReveal } from '../hooks/useReveal'

export default function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal(0.1)
  return (
    <div ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}
