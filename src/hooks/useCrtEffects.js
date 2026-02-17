import { useEffect } from 'react'

export default function useCrtEffects(detailLevel) {
  // R₂ low-discrepancy sequence for CRT phase distribution.
  // The plastic constant p ≈ 1.3247 (real root of p³ = p + 1) generates
  // the optimal 2D quasi-random sequence: offset_n = (n/p mod 1, n/p² mod 1).
  // Each always-on element gets a unique (dim, split) phase pair that fills
  // the 2D phase space as uniformly as possible — no clumping, no gaps.
  useEffect(() => {
    if (detailLevel !== 3) return
    const PHI = (1 + Math.sqrt(5)) / 2
    const PLASTIC = 1.32471795724474602596
    const DIM_DUR = 4
    const SPLIT_DUR = DIM_DUR * PHI
    const els = document.querySelectorAll('.hero-name-line.accent, .kw')
    els.forEach((el, i) => {
      const n = i + 1
      const r2_dim   = (n / PLASTIC) % 1
      const r2_split = (n / (PLASTIC * PLASTIC)) % 1
      el.style.animationDelay =
        `${-(r2_dim * DIM_DUR).toFixed(3)}s, ${-(r2_split * SPLIT_DUR).toFixed(3)}s`
    })
    return () => els.forEach(el => { el.style.animationDelay = '' })
  }, [detailLevel])

  // CRT noise — double-buffered SVG filters with CSS custom property flipping.
  // Three cross-browser problems solved simultaneously:
  //   1. Chrome resolves url(#id) in external CSS against the stylesheet URL,
  //      breaking inline SVG filter references. We inject a <style> in <head>.
  //   2. Chrome won't repaint when referenced SVG filter attributes change via
  //      setAttribute. We flip CSS custom properties (--crt-f, --crt-f-lg)
  //      between two buffer pairs (A/B) so the *computed filter value* changes.
  //   3. Safari ignores SMIL <animate> on feTurbulence seed. We use JS + a
  //      baseFrequency nudge to force WebKit to re-render the filter.
  useEffect(() => {
    if (detailLevel !== 3) return
    const root = document.documentElement
    // Inject <style> in <head> — rules use CSS custom properties for the filter URL
    const style = document.createElement('style')
    style.textContent = [
      'body.detail-3 .hero-name-line.accent { filter: var(--crt-f-lg); }',
      'body.detail-3 .snake-card:is(:hover,.th),',
      'body.detail-3 .pub-card:is(:hover,.th),',
      'body.detail-3 .se-card:is(:hover,.th),',
      'body.detail-3 .lnk:is(:hover,.th),',
      'body.detail-3 .kw:is(:hover,.th),',
      'body.detail-3 .nav-a:is(:hover,.th) { filter: var(--crt-f); }',
    ].join('\n')
    document.head.appendChild(style)
    // Set initial filter references on :root
    root.style.setProperty('--crt-f', 'url(#crt-noise-a)')
    root.style.setProperty('--crt-f-lg', 'url(#crt-noise-lg-a)')
    let seed = 0
    let buf = 'a'
    const id = setInterval(() => {
      seed = (seed + 1) % 12
      const next = buf === 'a' ? 'b' : 'a'
      // Update the off-screen buffer's seed before flipping to it
      document.querySelectorAll(`[data-crt-buf="${next}"]`).forEach(el => {
        el.setAttribute('seed', seed)
        // Nudge baseFrequency to force Safari/WebKit to re-render the filter
        el.setAttribute('baseFrequency', seed % 2 === 0 ? '0.015 0.8' : '0.0150001 0.8')
      })
      buf = next
      // Flip custom properties — changes the computed filter value, forcing repaint
      root.style.setProperty('--crt-f', `url(#crt-noise-${next})`)
      root.style.setProperty('--crt-f-lg', `url(#crt-noise-lg-${next})`)
    }, 83) // ~12fps
    return () => {
      clearInterval(id)
      style.remove()
      root.style.removeProperty('--crt-f')
      root.style.removeProperty('--crt-f-lg')
    }
  }, [detailLevel])
}
