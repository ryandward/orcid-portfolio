import { useEffect } from 'react'

// Weyl equidistribution for Level 2 ambient detuning.
// By Weyl's theorem, frac(n·√2) is equidistributed on [0,1].
// Each element gets a unique duration, so oscillators drift in/out of
// near-sync — like a dinoflagellate colony with individual metabolic rates.
export default function useWeylDetuning(detailLevel) {
  useEffect(() => {
    if (detailLevel !== 2) return
    const SQRT2 = Math.SQRT2
    const BASE = 5
    const RANGE = 2
    const els = document.querySelectorAll('.sec-line, .snake-track')
    els.forEach((el, i) => {
      const n = i + 1
      const weyl = (n * SQRT2) % 1
      el.style.setProperty('--bio-dur', `${(BASE + RANGE * weyl).toFixed(3)}s`)
    })
    return () => els.forEach(el => el.style.removeProperty('--bio-dur'))
  }, [detailLevel])
}
