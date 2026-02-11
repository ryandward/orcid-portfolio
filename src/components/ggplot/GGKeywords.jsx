export default function GGKeywords({ keywords }) {
  const sorted = [...keywords].sort((a, b) => a.localeCompare(b))

  // Format like R's print() output for a character vector
  const lines = []
  let currentLine = []
  let charCount = 0
  const maxWidth = 72

  sorted.forEach((kw, i) => {
    const entry = `"${kw}"`
    const needed = currentLine.length > 0 ? entry.length + 1 : entry.length
    if (charCount + needed > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = [entry]
      charCount = entry.length
    } else {
      currentLine.push(entry)
      charCount += needed
    }
  })
  if (currentLine.length > 0) lines.push(currentLine)

  // R uses [1], [n+1], etc. for line indices
  let idx = 1
  const formatted = lines.map(line => {
    const prefix = `[${idx}]`
    idx += line.length
    return { prefix, text: line.join(' ') }
  })

  return (
    <div className="gg-panel">
      <div className="gg-terminal">
        <div className="gg-term-line">
          <span className="gg-term-prompt">&gt; </span>
          <span className="gg-term-code">print(ryan_ward$skills)</span>
        </div>
        {formatted.map((line, i) => (
          <div key={i} className="gg-term-line">
            <span className="gg-term-index">{line.prefix.padStart(4)}</span>
            <span className="gg-term-string"> {line.text}</span>
          </div>
        ))}
        <div className="gg-term-line">
          <span className="gg-term-comment"># class: character | length: {sorted.length}</span>
        </div>
      </div>
    </div>
  )
}
