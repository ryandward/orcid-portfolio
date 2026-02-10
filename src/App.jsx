import { useState, useEffect } from 'react'
import { ORCID_ID, API_BASE, HEADERS, LINKEDIN } from './constants'
import { workYear, cleanType, getDoiUrl } from './utils'
import { Arrow, Chain } from './components/Icons'
import CountUp from './components/CountUp'
import Typer from './components/Typer'
import DnaHelix from './components/DnaHelix'
import Reveal from './components/Reveal'
import GlowCard from './components/GlowCard'
import SnakeTimeline from './components/SnakeTimeline'

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
