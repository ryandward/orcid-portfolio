import React, { useState, useEffect } from 'react'
import { ORCID_ID, LINKEDIN, FALLBACK_BIO, TAGLINE, SE_USER_ID } from './constants'
import { cleanType, getDoiUrl, fixTitle, workYear } from './utils'
import { fetchOrcidData, fetchStackExchange } from './api'
import { Arrow, Chain } from './components/Icons'
import CountUp from './components/CountUp'
import Typer from './components/Typer'
import DnaHelix from './components/DnaHelix'
import BiolumField from './components/BiolumField'
import Reveal from './components/Reveal'
import GlowCard from './components/GlowCard'
import useProximityGlow from './hooks/useProximityGlow'
import useGcdGrid from './hooks/useGcdGrid'
import useDetailLevel from './hooks/useDetailLevel'
import useTouchHover from './hooks/useTouchHover'
import useCrtEffects from './hooks/useCrtEffects'
import useWeylDetuning from './hooks/useWeylDetuning'
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

  const { detailLevel, setDetailLevel, toast } = useDetailLevel(3)
  useTouchHover(detailLevel)
  useCrtEffects(detailLevel)
  useWeylDetuning(detailLevel)
  useProximityGlow(detailLevel === 2)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // GCD-smart grids for nav + links
  const [navRef, navCols] = useGcdGrid(80, 0, loading)
  const [linksRef, linkCols] = useGcdGrid(240, 12, loading)

  async function fetchData() {
    setLoading(true); setError(null)
    try {
      const [{ person: p, works: w, educations: e }, seResult] = await Promise.all([
        fetchOrcidData(),
        fetchStackExchange(),
      ])
      setPerson(p)
      setWorks(w)
      setEducations(e)
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
      {/* Double-buffered SVG feTurbulence filters for CRT cathode noise.
          Perlin gradient noise (1983) generates fractal Brownian motion;
          asymmetric baseFrequency (low X=0.015, high Y=0.8) creates coherent
          horizontal banding per scan line. Two identical A/B pairs allow the JS
          seed cycling to flip the CSS url() reference on each tick, forcing all
          browsers to repaint. See useCrtEffects hook. */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          {['a', 'b'].map(buf => (
            <React.Fragment key={buf}>
              <filter id={`crt-noise-lg-${buf}`} x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence data-crt-buf={buf} type="fractalNoise" baseFrequency="0.015 0.8"
                  numOctaves="3" result="noise" seed="0"/>
                <feDisplacementMap in="SourceGraphic" in2="noise"
                  scale="4" xChannelSelector="R" yChannelSelector="G"/>
              </filter>
              <filter id={`crt-noise-${buf}`} x="-5%" y="-5%" width="110%" height="110%">
                <feTurbulence data-crt-buf={buf} type="fractalNoise" baseFrequency="0.015 0.8"
                  numOctaves="3" result="noise" seed="0"/>
                <feDisplacementMap in="SourceGraphic" in2="noise"
                  scale="2" xChannelSelector="R" yChannelSelector="G"/>
              </filter>
            </React.Fragment>
          ))}
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
        <div ref={navRef} className="nav-inner" style={navCols ? { display: 'grid', gridTemplateColumns: `repeat(${navCols}, auto)`, justifyContent: 'center' } : undefined}>
          <a className="nav-a" href="#xp">Experience</a>
          <a className="nav-a" href="#edu">Education</a>
          <a className="nav-a" href="#pub">Publications</a>
          {seData.length > 0 && <a className="nav-a" href="#se">Stack Exchange</a>}
          {allKeywords.length > 0 && <a className="nav-a" href="#kw">Skills</a>}
          {allLinks.length > 0 && <a className="nav-a" href="#links">Links</a>}
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
          <div ref={linksRef} className="links-list" style={linkCols ? { gridTemplateColumns: `repeat(${linkCols}, 1fr)` } : undefined}>
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
