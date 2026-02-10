import { useState, useEffect, useRef, useCallback } from 'react'

const ORCID_ID = '0000-0001-9537-2461'
const API_BASE = `https://pub.orcid.org/v3.0/${ORCID_ID}`
const HEADERS = { Accept: 'application/json' }

const LINKEDIN = {
  headline: "PhD Geneticist",
  location: "Santa Barbara, CA",
  experience: [
    { title: "Founding Scientist", org: "Stealth Startup", start: "Feb 2026", end: null, current: true },
    { title: "Senior Scientist", org: "Temporal Agriculture", start: "Jan 2025", end: "Jan 2026", location: "Santa Barbara, CA" },
    { title: "Postdoctoral Researcher", org: "University of Wisconsin\u2013Madison", start: "Dec 2024", end: "Jan 2025" },
    { title: "PhD Researcher", org: "University of Wisconsin\u2013Madison", start: "Sep 2019", end: "Dec 2024" },
    { title: "Bioinformatics Intern", org: "Temporal Agriculture", start: "May 2024", end: "Jul 2024", location: "Santa Barbara, CA" },
    { title: "Emergency Department Scribe", org: "MountainView Regional Medical Center", start: "Mar 2017", end: "Aug 2019", location: "Las Cruces, NM" },
    { title: "Policy Analyst", org: "New Mexico Department of Agriculture", start: "Nov 2012", end: "Jan 2017", location: "Las Cruces, NM" },
    { title: "Intelligence Analyst", org: "POSIT", start: "May 2009", end: "May 2012", location: "Las Cruces, NM" },
  ],
  skills: ["Statistical Software", "Next-Generation Sequencing (NGS)", "HIPAA"],
  links: [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/ryanw-346889253" },
    { name: "Stack Overflow", url: "https://stackoverflow.com/users/714178" },
  ],
}

function fmtEduDate(item) { return item['end-date']?.year?.value || 'In progress' }
function workYear(w) { return w['publication-date']?.year?.value || '\u2014' }
function cleanType(t) { return t ? t.replace(/-/g, ' ') : '' }
function getDoiUrl(extIds) {
  if (!extIds?.['external-id']) return null
  const doi = extIds['external-id'].find(e => e['external-id-type'] === 'doi')
  if (doi) { const v = doi['external-id-value']; return v.startsWith('http') ? v : `https://doi.org/${v}` }
  const u = extIds['external-id'].find(e => e['external-id-url']?.value)
  return u?.['external-id-url']?.value || null
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
  </svg>
)
const Chain = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

// ─── Scroll reveal hook ──────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

// ─── Count-up ────────────────────────────
function CountUp({ target, duration = 1200 }) {
  const [val, setVal] = useState(0)
  const [ref, visible] = useReveal(0.5)
  useEffect(() => {
    if (!visible) return
    let start = 0
    const step = Math.max(1, Math.floor(duration / target))
    const timer = setInterval(() => {
      start++; setVal(start)
      if (start >= target) clearInterval(timer)
    }, step)
    return () => clearInterval(timer)
  }, [visible, target, duration])
  return <span ref={ref}>{val}</span>
}

// ─── Typer ───────────────────────────────
function Typer({ text, speed = 45, delay = 400 }) {
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

// ─── DNA Helix ───────────────────────────
function DnaHelix() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, t = 0
    function resize() {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()
    window.addEventListener('resize', resize)
    function draw() {
      const w = canvas.offsetWidth, h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)
      const points = 50, amplitude = w * 0.1, centerX = w * 0.85, spacing = h / points
      for (let i = 0; i < points; i++) {
        const y = i * spacing, phase = (i * 0.18) + t
        const x1 = centerX + Math.sin(phase) * amplitude
        const x2 = centerX + Math.sin(phase + Math.PI) * amplitude
        const d1 = (Math.sin(phase) + 1) / 2, d2 = (Math.sin(phase + Math.PI) + 1) / 2
        if (i % 3 === 0) {
          ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y)
          ctx.strokeStyle = `rgba(0,255,136,${0.03 + d1 * 0.05})`; ctx.lineWidth = 1; ctx.stroke()
        }
        if (i > 0) {
          const py = (i-1)*spacing
          ctx.beginPath(); ctx.moveTo(centerX + Math.sin(((i-1)*0.18)+t)*amplitude, py); ctx.lineTo(x1, y)
          ctx.strokeStyle = `rgba(0,255,136,${0.06 + d1*0.12})`; ctx.lineWidth = 1.5; ctx.stroke()
          ctx.beginPath(); ctx.moveTo(centerX + Math.sin(((i-1)*0.18)+t+Math.PI)*amplitude, py); ctx.lineTo(x2, y)
          ctx.strokeStyle = `rgba(0,212,255,${0.04 + d2*0.1})`; ctx.lineWidth = 1.5; ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(x1, y, 2+d1*1.5, 0, Math.PI*2)
        ctx.fillStyle = `rgba(0,255,136,${0.12+d1*0.3})`; ctx.fill()
        ctx.beginPath(); ctx.arc(x2, y, 2+d2*1.5, 0, Math.PI*2)
        ctx.fillStyle = `rgba(0,212,255,${0.1+d2*0.25})`; ctx.fill()
      }
      t += 0.012; animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="dna-canvas"/>
}

// ─── Reveal wrapper ──────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useReveal(0.1)
  return (
    <div ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

// ─── Glow Card (mouse-tracking border glow) ─────
function GlowCard({ children, className = '', href, onClick }) {
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

// ─── Snake Timeline ──────────────────────
function SnakeTimeline({ items, type }) {
  return (
    <div className="snake">
      {items.map((item, i) => {
        const isLeft = i % 2 === 0
        const isLast = i === items.length - 1
        const isCurrent = type === 'xp' ? item.current : false
        return (
          <Reveal key={i} delay={i * 80}>
            <div className="snake-row">
              <div className={`snake-track ${isLeft ? 'left' : 'right'} ${isLast ? 'last' : ''}`}>
                <div className={`snake-node ${isCurrent ? 'now' : ''}`}/>
              </div>
              <GlowCard className={`snake-card ${isLeft ? 'left' : 'right'}`}>
                {type === 'xp' ? (
                  <>
                    <div className="snake-dates">
                      {item.start} &mdash; {item.end || 'Present'}
                      {item.location && <span className="snake-loc"> / {item.location}</span>}
                    </div>
                    <div className="snake-role">{item.title}</div>
                    <div className="snake-org">{item.org}</div>
                  </>
                ) : (
                  <>
                    <div className="snake-dates">{fmtEduDate(item)}</div>
                    <div className="snake-role">
                      {item['role-title'] || item['department-name'] || 'Student'}
                    </div>
                    <div className="snake-org">{item.organization?.name}</div>
                    {item['role-title'] && item['department-name'] && (
                      <div className="snake-dept">{item['department-name']}</div>
                    )}
                  </>
                )}
              </GlowCard>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

// ─── App ─────────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [person, setPerson] = useState(null)
  const [works, setWorks] = useState([])
  const [educations, setEducations] = useState([])
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function fetchData() {
    setLoading(true); setError(null)
    try {
      const [pRes, wRes, eRes] = await Promise.all([
        fetch(`${API_BASE}/person`, { headers: HEADERS }),
        fetch(`${API_BASE}/works`, { headers: HEADERS }),
        fetch(`${API_BASE}/educations`, { headers: HEADERS }),
      ])
      if (!pRes.ok) throw new Error('ORCID API returned ' + pRes.status)
      setPerson(await pRes.json())
      const wd = await wRes.json()
      setWorks(
        (wd.group || []).map(g => g['work-summary']?.[0]).filter(Boolean)
          .sort((a, b) => (parseInt(workYear(b)) || 0) - (parseInt(workYear(a)) || 0))
      )
      const ed = await eRes.json()
      setEducations(
        (ed['affiliation-group'] || []).map(g => g.summaries?.[0]?.['education-summary']).filter(Boolean)
          .sort((a, b) =>
            (parseInt(b['end-date']?.year?.value || b['start-date']?.year?.value) || 0) -
            (parseInt(a['end-date']?.year?.value || a['start-date']?.year?.value) || 0)
          )
      )
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
      <header className="hero">
        <div className="hero-bg"/>
        <div className="hero-grid" style={{ transform: `translateY(${scrollY * 0.12}px)` }}/>
        <DnaHelix/>
        <div className="hero-inner">
          <div className="hero-prompt">
            <Typer text="> researcher / engineer / builder" speed={28} delay={300}/>
          </div>
          <h1 className="hero-name">
            <span className="hero-name-line" style={{ animationDelay: '0.4s' }}>{givenName}</span>
            <span className="hero-name-line accent" style={{ animationDelay: '0.55s' }}>{familyName}</span>
          </h1>
          {bio ? <p className="hero-bio">{bio}</p> : (
            <p className="hero-bio">
              <strong>Geneticist</strong> and <strong>bioinformatician</strong> building
              tools at the intersection of genomics, CRISPRi, and computational biology.
            </p>
          )}
          <div className="hero-stats">
            <span className="stat stat--id">
              <a href={`https://orcid.org/${ORCID_ID}`} target="_blank" rel="noopener noreferrer">ORCID {ORCID_ID}</a>
            </span>
            <span className="stat">{LINKEDIN.location}</span>
            <span className="stat"><span className="val"><CountUp target={works.length}/></span> publications</span>
            <span className="stat"><span className="val"><CountUp target={LINKEDIN.experience.length}/></span> roles</span>
          </div>
        </div>
      </header>

      <nav className={`nav ${scrollY > 60 ? 'nav--scrolled' : ''}`}>
        <div className="nav-inner">
          <a className="nav-a" href="#xp">Experience</a>
          <a className="nav-a" href="#edu">Education</a>
          <a className="nav-a" href="#pub">Publications</a>
          {allKeywords.length > 0 && <a className="nav-a" href="#kw">Skills</a>}
          {allLinks.length > 0 && <a className="nav-a" href="#links">Links</a>}
        </div>
      </nav>

      <section className="section" id="xp">
        <Reveal><div className="sec-head">
          <span className="sec-label">0{++n}</span>
          <h2 className="sec-title">Experience</h2>
          <div className="sec-line"/>
        </div></Reveal>
        <SnakeTimeline items={LINKEDIN.experience} type="xp"/>
      </section>

      {educations.length > 0 && (
        <section className="section" id="edu">
          <Reveal><div className="sec-head">
            <span className="sec-label">0{++n}</span>
            <h2 className="sec-title">Education</h2>
            <div className="sec-line"/>
          </div></Reveal>
          <SnakeTimeline items={educations} type="edu"/>
        </section>
      )}

      {works.length > 0 && (
        <section className="section" id="pub">
          <Reveal><div className="sec-head">
            <span className="sec-label">0{++n}</span>
            <h2 className="sec-title">Publications</h2>
            <div className="sec-line"/>
            <span className="sec-count">{works.length}</span>
          </div></Reveal>
          <div className="pub-grid">
            {works.map((w, i) => {
              const title = w.title?.title?.value || 'Untitled'
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
                    {doi && (
                      <div className="pub-arrow"><Arrow/></div>
                    )}
                  </GlowCard>
                </Reveal>
              )
            })}
          </div>
        </section>
      )}

      {allKeywords.length > 0 && (
        <section className="section" id="kw">
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
        </section>
      )}

      {allLinks.length > 0 && (
        <section className="section" id="links">
          <Reveal><div className="sec-head">
            <span className="sec-label">0{++n}</span>
            <h2 className="sec-title">Links</h2>
            <div className="sec-line"/>
          </div></Reveal>
          <div className="links-list">
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
          Publications via <a href={`https://orcid.org/${ORCID_ID}`} target="_blank" rel="noopener noreferrer">ORCID</a> &middot; Experience via LinkedIn
        </div>
        <div className="footer-r">auto-refreshes on every visit</div>
      </footer>
    </div>
  )
}
