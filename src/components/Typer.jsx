import { useState, useEffect } from 'react'

export default function Typer({ text, speed = 45, delay = 400 }) {
  const [displayed, setDisplayed] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  useEffect(() => {
    let i = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1)); i++
        if (i >= text.length) { clearInterval(interval); setTimeout(() => setShowCursor(false), 1500) }
      }, speed)
      return () => clearInterval(interval)
    }, delay)
    return () => clearTimeout(timeout)
  }, [text, speed, delay])
  return <span>{displayed}{showCursor && <span className="cursor">|</span>}</span>
}
