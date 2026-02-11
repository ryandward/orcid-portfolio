import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { ORCID_ID, API_BASE, HEADERS, LINKEDIN, FALLBACK_BIO, TAGLINE, SE_USER_ID, SE_API, SE_KEY, SE_FILTER } from './constants'
import { workYear, cleanType, getDoiUrl, fixTitle } from './utils'
import { Arrow, Chain } from './components/Icons'
import CountUp from './components/CountUp'
import Typer from './components/Typer'
import DnaHelix from './components/DnaHelix'
import BiolumField from './components/BiolumField'
import Reveal from './components/Reveal'
import GlowCard from './components/GlowCard'
import useProximityGlow from './hooks/useProximityGlow'
import SnakeTimeline from './components/SnakeTimeline'
import StackExchangeSection from './components/StackExchangeSection'
import GGExperience from './components/ggplot/GGExperience'
import GGPublications from './components/ggplot/GGPublications'
import GGEducation from './components/ggplot/GGEducation'
import GGStackExchange from './components/ggplot/GGStackExchange'
import SmoothResize from './components/SmoothResize'
import GGKeywords from './components/ggplot/GGKeywords'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [person, setPerson] = useState(null)
  const [works, setWorks] = useState([])
  const [educations, setEducations] = useState([])
  const [seData, setSeData] = useState([])
  const [scrollY, setScrollY] = useState(0)
  const [detailLevel, setDetailLevel] = useState(3)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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

  // Touch-hover for level 3: first tap shows CRT effects, second tap navigates
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

  // Weyl equidistribution for Level 2 ambient detuning.
  // By Weyl's theorem, frac(n·√2) is equidistributed on [0,1].
  // Each element gets a unique duration, so oscillators drift in/out of
  // near-sync — like a dinoflagellate colony with individual metabolic rates.
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

  // Mouse proximity glow for level 2 cards
  useProximityGlow(detailLevel === 2)

  const SE_CACHE_KEY = 'se_cache_v4'
  const SE_CACHE_TTL = 60 * 60 * 1000 // 1 hour

  async function fetchStackExchange() {
    try {
      const cached = localStorage.getItem(SE_CACHE_KEY)
      if (cached) {
        const { data, ts } = JSON.parse(cached)
        if (Date.now() - ts < SE_CACHE_TTL && data.length > 0) return data
      }
    } catch {}

    try {
      const soRes = await fetch(`${SE_API}/users/${SE_USER_ID}?site=stackoverflow&key=${SE_KEY}`)
      const soData = await soRes.json()
      const accountId = soData.items?.[0]?.account_id
      if (!accountId) return []

      const assocRes = await fetch(`${SE_API}/users/${accountId}/associated?pagesize=100&key=${SE_KEY}`)
      const assocData = await assocRes.json()

      const activeSites = (assocData.items || []).filter(s => s.reputation >= 500)

      const siteData = await Promise.all(activeSites.map(async site => {
        const hostname = new URL(site.site_url).hostname
        const apiName = hostname.split('.')[0]
        const [qRes, aRes] = await Promise.all([
          fetch(`${SE_API}/users/${site.user_id}/questions?order=desc&sort=votes&site=${apiName}&pagesize=5&key=${SE_KEY}&filter=${encodeURIComponent(SE_FILTER)}`).then(r => r.json()),
          fetch(`${SE_API}/users/${site.user_id}/answers?order=desc&sort=votes&site=${apiName}&pagesize=3&key=${SE_KEY}&filter=${encodeURIComponent(SE_FILTER)}`).then(r => r.json()),
        ])

        const answers = aRes.items || []
        let answersWithTitles = answers
        if (answers.length > 0) {
          const qIds = answers.map(a => a.question_id).join(';')
          const qtRes = await fetch(`${SE_API}/questions/${qIds}?site=${apiName}&key=${SE_KEY}`).then(r => r.json())
          const titleMap = {}
          for (const q of (qtRes.items || [])) titleMap[q.question_id] = q.title
          answersWithTitles = answers.map(a => ({ ...a, question_title: titleMap[a.question_id] || null }))
        }

        const filteredQ = (qRes.items || []).filter(q => q.score >= 10)
        const filteredA = answersWithTitles.filter(a => a.score >= 5)
        return { ...site, questions: filteredQ, answers: filteredA }
      }))

      const result = siteData
        .filter(s => s.questions.length > 0 || s.answers.length > 0)
        .sort((a, b) => {
          const scoreA = [...a.questions, ...a.answers].reduce((s, x) => s + (x.score || 0), 0)
          const scoreB = [...b.questions, ...b.answers].reduce((s, x) => s + (x.score || 0), 0)
          return scoreB - scoreA
        })

      try { localStorage.setItem(SE_CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() })) } catch {}
      return result
    } catch (err) {
      console.warn('Stack Exchange fetch failed:', err)
      return []
    }
  }

  async function fetchData() {
    setLoading(true); setError(null)
    try {
      const [pRes, wRes, eRes, seResult] = await Promise.all([
        fetch(`${API_BASE}/person`, { headers: HEADERS }),
        fetch(`${API_BASE}/works`, { headers: HEADERS }),
        fetch(`${API_BASE}/educations`, { headers: HEADERS }),
        fetchStackExchange(),
      ])
      if (!pRes.ok) throw new Error('ORCID API returned ' + pRes.status)
      setPerson(await pRes.json())
      const wd = await wRes.json()
      const summaries = (wd.group || []).map(g => g['work-summary']?.[0]).filter(Boolean)
        .sort((a, b) => (parseInt(workYear(b)) || 0) - (parseInt(workYear(a)) || 0))
      const withLabs = await Promise.all(summaries.map(async w => {
        try {
          const full = await fetch(`${API_BASE}/work/${w['put-code']}`, { headers: HEADERS }).then(r => r.json())
          const contribs = (full?.contributors?.contributor || [])
            .filter(c => !c['contributor-attributes']?.['contributor-role'] || c['contributor-attributes']['contributor-role'] === 'author')
          if (contribs.length > 0) {
            const last = contribs[contribs.length - 1]?.['credit-name']?.value
            if (last) {
              const surname = last.split(' ').pop().replace(/,$/, '')
              return { ...w, labName: `${surname} Lab` }
            }
          }
        } catch {}
        return w
      }))
      setWorks(withLabs)
      const ed = await eRes.json()
      setEducations(
        (ed['affiliation-group'] || []).map(g => g.summaries?.[0]?.['education-summary']).filter(Boolean)
          .sort((a, b) =>
            (parseInt(b['end-date']?.year?.value || b['start-date']?.year?.value) || 0) -
            (parseInt(a['end-date']?.year?.value || a['start-date']?.year?.value) || 0)
          )
      )
      setSeData(seResult)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-helix">
        <div className="helix-dot d1"/><div className="helix-dot d2"/>
        <div className="helix-dot d3"/><div className="helix-dot d4"/>
      </div>
      <div className="loading-text"><Typer text="$ fetching orcid profile..." speed={35} delay={200}/></div>
    </div>
  )
  if (error) return (
    <div className="error-screen">
      <h2>// connection failed</h2><p>{error}</p>
      <button className="retry-btn" onClick={fetchData}>retry</button>
    </div>
  )

  const givenName = person?.name?.['given-names']?.value || ''
  const familyName = person?.name?.['family-name']?.value || ''
  const bio = person?.biography?.content || ''
  const keywords = (person?.keywords?.keyword || []).map(k => k.content)
  const orcidUrls = (person?.['researcher-urls']?.['researcher-url'] || [])
    .map(u => ({ name: u['url-name'], url: u.url?.value }))
  const allLinks = [...LINKEDIN.links]
  orcidUrls.forEach(u => { if (!allLinks.some(l => l.url === u.url)) allLinks.push(u) })
  const allKeywords = [...new Set([...keywords, ...LINKEDIN.skills])]
  let n = 0

  return (
    <div className="portfolio">
      {/* SVG feTurbulence displacement filter for CRT cathode noise.
          Perlin gradient noise (1983) generates fractal Brownian motion;
          asymmetric baseFrequency (low X=0.015, high Y=0.8) creates coherent
          horizontal banding per scan line. Seed cycles discretely at ~12fps
          for jittery, non-interpolated pattern changes. */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="cloud-turbulence">
            <feTurbulence type="fractalNoise" baseFrequency=".01" numOctaves="6" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="170" />
          </filter>
          <filter id="crt-noise-lg" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.8"
              numOctaves="3" result="noise">
              <animate attributeName="seed"
                values="0;1;2;3;4;5;6;7;8;9;10;11"
                dur="1s" calcMode="discrete" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise"
              scale="4" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
          <filter id="crt-noise" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.015 0.8"
              numOctaves="3" result="noise">
              <animate attributeName="seed"
                values="0;1;2;3;4;5;6;7;8;9;10;11"
                dur="1s" calcMode="discrete" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise"
              scale="2" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </defs>
      </svg>
      <BiolumField active={detailLevel === 2}/>
      <SmoothResize><header className="hero">
        <div className="hero-bg"/>
        <div className="hero-grid" style={{ transform: `translateY(${scrollY * [0, 0, 0.12, 0.25, 0][detailLevel]}px)` }}/>
        <DnaHelix level={detailLevel}/>
        {detailLevel === 1 && (
          <div className="geo-banner">
            <div className="geo-marquee">
              <span>Welcome to my homepage! You are visitor #001337! Last updated {new Date().toLocaleDateString()}!</span>
            </div>
            <div className="geo-construction">Under Construction</div>
          </div>
        )}
        <div className="hero-inner">
          {detailLevel !== 4 && (
            <div className="hero-prompt">
              <Typer text={`> ${TAGLINE}`} speed={45} delay={300}/>
            </div>
          )}
          {detailLevel === 4 ? (
            <>
              <div className="gg-terminal gg-hero-terminal">
                <div className="gg-term-line">
                  <span className="gg-term-prompt">&gt; </span>
                  <span className="gg-term-code">ryan_ward &lt;- list(</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-code">  name    = </span>
                  <span className="gg-term-string">"{givenName} {familyName}"</span>
                  <span className="gg-term-code">,</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-code">  title   = </span>
                  <span className="gg-term-string">"{LINKEDIN.headline}"</span>
                  <span className="gg-term-code">,</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-code">  loc     = </span>
                  <span className="gg-term-string">"{LINKEDIN.location}"</span>
                  <span className="gg-term-code">,</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-code">  pubs    = </span>
                  <span className="gg-term-code">{works.length}</span>
                  <span className="gg-term-code">,</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-code">  roles   = </span>
                  <span className="gg-term-code">{LINKEDIN.experience.length}</span>
                  <span className="gg-term-code">,</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-code">  orcid   = </span>
                  <span className="gg-term-string">"{ORCID_ID}"</span>
                  <span className="gg-term-code">,</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-code">  bio     = </span>
                  <span className="gg-term-string">"{bio || FALLBACK_BIO}"</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-code">)</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-prompt">&gt; </span>
                  <span className="gg-term-code">ggplot(data = ryan_ward)</span>
                </div>
                <div className="gg-term-line">
                  <span className="gg-term-comment"># <Typer text={TAGLINE} speed={45} delay={300}/></span>
                </div>
              </div>
            </>
          ) : (
            <>
              <h1 className="hero-name">
                <span className="hero-name-line" style={{ animationDelay: '0.4s' }}>{givenName}</span>
                <span className="hero-name-line accent" style={{ animationDelay: '0.55s' }}>{familyName}</span>
              </h1>
              <p className="hero-bio">{bio || FALLBACK_BIO}</p>
              <div className="hero-stats">
                <span className="stat stat--id">
                  <a href={`https://orcid.org/${ORCID_ID}`} target="_blank" rel="noopener noreferrer">ORCID {ORCID_ID}</a>
                </span>
                <span className="stat">{LINKEDIN.location}</span>
                <span className="stat"><span className="val"><CountUp target={works.length}/></span> publications</span>
                <span className="stat"><span className="val"><CountUp target={LINKEDIN.experience.length}/></span> roles</span>
              </div>
            </>
          )}
        </div>
      </header></SmoothResize>

      <nav className={`nav ${scrollY > 60 ? 'nav--scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-group">
            <a className="nav-a" href="#xp">Experience</a>
            <a className="nav-a" href="#edu">Education</a>
            <a className="nav-a" href="#pub">Publications</a>
          </div>
          <div className="nav-group">
            {seData.length > 0 && <a className="nav-a" href="#se">Stack Exchange</a>}
            {allKeywords.length > 0 && <a className="nav-a" href="#kw">Skills</a>}
            {allLinks.length > 0 && <a className="nav-a" href="#links">Links</a>}
          </div>
        </div>
        <div className="nav-levels">
          {[1, 2, 3, 4].map(n => (
            <button key={n} className={`nav-lvl${detailLevel === n ? ' active' : ''}`} onClick={() => setDetailLevel(n)}>{n}</button>
          ))}
        </div>
      </nav>

      <section className="section" id="xp">
        {detailLevel === 4 ? (
          <GGExperience experience={LINKEDIN.experience}/>
        ) : (
          <>
            <Reveal><div className="sec-head">
              <span className="sec-label">0{++n}</span>
              <h2 className="sec-title">Experience</h2>
              <div className="sec-line"/>
            </div></Reveal>
            <SnakeTimeline items={LINKEDIN.experience} type="xp"/>
          </>
        )}
      </section>

      {educations.length > 0 && (
        <section className="section" id="edu">
          {detailLevel === 4 ? (
            <GGEducation educations={educations}/>
          ) : (
            <>
              <Reveal><div className="sec-head">
                <span className="sec-label">0{++n}</span>
                <h2 className="sec-title">Education</h2>
                <div className="sec-line"/>
              </div></Reveal>
              <SnakeTimeline items={educations} type="edu"/>
            </>
          )}
        </section>
      )}

      {works.length > 0 && (
        <section className="section" id="pub">
          {detailLevel === 4 ? (
            <GGPublications works={works}/>
          ) : (
            <>
              <Reveal><div className="sec-head">
                <span className="sec-label">0{++n}</span>
                <h2 className="sec-title">Publications</h2>
                <div className="sec-line"/>
                <span className="sec-count">{works.length}</span>
              </div></Reveal>
              <div className="pub-grid">
                  {works.map((w, i) => {
                    const title = fixTitle(w.title?.title?.value) || 'Untitled'
                    const journal = w['journal-title']?.value || ''
                    const type = cleanType(w.type)
                    const year = workYear(w)
                    const doi = getDoiUrl(w['external-ids'])
                    return (
                      <Reveal key={i} delay={i * 60}>
                        <GlowCard className="pub-card" href={doi}>
                          <div className="pub-card-top">
                            <span className="pub-year">{year}</span>
                            <span className="pub-type">{type}</span>
                          </div>
                          <h3 className="pub-title">{title}</h3>
                          {journal && <div className="pub-journal">{journal}</div>}
                          {w.labName && <div className="pub-lab">{w.labName}</div>}
                          {doi && (
                            <div className="pub-arrow"><Arrow/></div>
                          )}
                        </GlowCard>
                      </Reveal>
                    )
                  })}
              </div>
            </>
          )}
        </section>
      )}

      {seData.length > 0 && (
        <section className="section" id="se">
          {detailLevel === 4 ? (
            <GGStackExchange seData={seData}/>
          ) : (
            <>
              <Reveal><div className="sec-head">
                <span className="sec-label">0{++n}</span>
                <h2 className="sec-title">Stack Exchange</h2>
                <div className="sec-line"/>
              </div></Reveal>
              <StackExchangeSection seData={seData}/>
            </>
          )}
        </section>
      )}

      {allKeywords.length > 0 && (
        <section className="section" id="kw">
          {detailLevel === 4 ? (
            <GGKeywords keywords={allKeywords}/>
          ) : (
            <>
              <Reveal><div className="sec-head">
                <span className="sec-label">0{++n}</span>
                <h2 className="sec-title">Research Interests &amp; Skills</h2>
                <div className="sec-line"/>
              </div></Reveal>
              <div className="kw-wrap">
                {allKeywords.map((k, i) => (
                  <Reveal key={i} delay={i * 40} className="kw-reveal">
                    <span className="kw">{k}</span>
                  </Reveal>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {allLinks.length > 0 && detailLevel !== 4 && (
        <section className="section" id="links">
          <Reveal><div className="sec-head">
            <span className="sec-label">0{++n}</span>
            <h2 className="sec-title">Links</h2>
            <div className="sec-line"/>
          </div></Reveal>
          <div className="links-list" style={{ gridTemplateColumns: `repeat(${allLinks.length % 3 === 0 ? 3 : allLinks.length % 2 === 0 ? 2 : 3}, 1fr)` }}>
              {allLinks.map((l, i) => (
                <Reveal key={i} delay={i * 60}>
                  <GlowCard className="lnk" href={l.url}>
                    <div className="lnk-icon"><Chain/></div>
                    <div>
                      <div className="lnk-name">{l.name || 'Website'}</div>
                      <div className="lnk-url">{l.url?.replace(/^https?:\/\//, '')}</div>
                    </div>
                  </GlowCard>
                </Reveal>
              ))}
          </div>
        </section>
      )}

      <footer className="footer">
        <div className="footer-l">
          Publications via <a href={`https://orcid.org/${ORCID_ID}`} target="_blank" rel="noopener noreferrer">ORCID</a> &middot; Q&amp;A via <a href={`https://stackoverflow.com/users/${SE_USER_ID}`} target="_blank" rel="noopener noreferrer">Stack Exchange</a> &middot; Experience via LinkedIn
        </div>
        <div className="footer-r">auto-refreshes on every visit</div>
        {detailLevel === 1 && (
          <div className="geo-badge">Best viewed in Netscape Navigator 4.0 at 800x600</div>
        )}
      </footer>
      <div className={`detail-toast ${toast ? 'visible' : ''}`}>{toast}</div>
    </div>
  )
}
