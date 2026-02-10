import { useState, useEffect, useRef } from 'react'
import { ORCID_ID, API_BASE, HEADERS, LINKEDIN, SE_USER_ID, SE_API, SE_KEY } from './constants'
import { workYear, cleanType, getDoiUrl, fixTitle } from './utils'
import { Arrow, Chain } from './components/Icons'
import CountUp from './components/CountUp'
import Typer from './components/Typer'
import DnaHelix from './components/DnaHelix'
import Reveal from './components/Reveal'
import GlowCard from './components/GlowCard'
import SnakeTimeline from './components/SnakeTimeline'
import StackExchangeSection from './components/StackExchangeSection'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [person, setPerson] = useState(null)
  const [works, setWorks] = useState([])
  const [educations, setEducations] = useState([])
  const [seData, setSeData] = useState([])
  const [scrollY, setScrollY] = useState(0)
  const [detailLevel, setDetailLevel] = useState(2)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.className = `detail-${detailLevel}`
  }, [detailLevel])

  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      const n = parseInt(e.key)
      if (n >= 1 && n <= 3) setDetailLevel(n)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const didMount = useRef(false)
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return }
    const labels = { 1: 'css: unloaded', 2: 'detail: normal', 3: 'EDITORIAL MODE' }
    setToast(labels[detailLevel])
    const id = setTimeout(() => setToast(null), 1500)
    return () => clearTimeout(id)
  }, [detailLevel])

  const SE_CACHE_KEY = 'se_cache_v3'
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
          fetch(`${SE_API}/users/${site.user_id}/questions?order=desc&sort=votes&site=${apiName}&pagesize=5&key=${SE_KEY}`).then(r => r.json()),
          fetch(`${SE_API}/users/${site.user_id}/answers?order=desc&sort=votes&site=${apiName}&pagesize=3&key=${SE_KEY}`).then(r => r.json()),
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
      <header className="hero">
        <div className="hero-bg"/>
        <div className="hero-grid" style={{ transform: `translateY(${scrollY * [0, 0, 0.12, 0.25][detailLevel]}px)` }}/>
        <DnaHelix level={detailLevel}/>
        <div className="hero-inner">
          <div className="hero-prompt">
            <Typer text="> researcher / engineer / builder" speed={45} delay={300}/>
          </div>
          <h1 className="hero-name">
            <span className="hero-name-line" style={{ animationDelay: '0.4s' }}>{givenName}</span>
            <span className="hero-name-line accent" style={{ animationDelay: '0.55s' }}>{familyName}</span>
          </h1>
          {bio ? <p className="hero-bio">{bio}</p> : (
            <p className="hero-bio">
              <strong>Geneticist</strong> and <strong>computational biologist</strong> who
              builds tools for people who don't know what GitHub is. CRISPRi pipelines
              for a lab that needed them yesterday. A fair loot system for 479 EverQuest
              players who just want their dragon drops. Zero GitHub stars. Lots of users.
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
          {seData.length > 0 && <a className="nav-a" href="#se">Stack Exchange</a>}
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
        </section>
      )}

      {seData.length > 0 && (
        <section className="section" id="se">
          <Reveal><div className="sec-head">
            <span className="sec-label">0{++n}</span>
            <h2 className="sec-title">Stack Exchange</h2>
            <div className="sec-line"/>
          </div></Reveal>
          <StackExchangeSection seData={seData}/>
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
          Publications via <a href={`https://orcid.org/${ORCID_ID}`} target="_blank" rel="noopener noreferrer">ORCID</a> &middot; Q&amp;A via <a href={`https://stackoverflow.com/users/${SE_USER_ID}`} target="_blank" rel="noopener noreferrer">Stack Exchange</a> &middot; Experience via LinkedIn
        </div>
        <div className="footer-r">auto-refreshes on every visit <span className="footer-hint">· press 1 2 3</span></div>
      </footer>
      <div className={`detail-toast ${toast ? 'visible' : ''}`}>{toast}</div>
    </div>
  )
}
