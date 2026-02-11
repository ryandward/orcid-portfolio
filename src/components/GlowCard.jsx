export default function GlowCard({ children, className = '', href, onClick }) {
  const Tag = href ? 'a' : 'div'
  const extraProps = href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {}

  return (
    <Tag className={`glow-card ${className}`}
      onClick={onClick} {...extraProps}>
      {children}
    </Tag>
  )
}
