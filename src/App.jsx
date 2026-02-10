import { useState, useEffect } from 'react'

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

// ─── Helpers ─────────────────────────────
function fmtEduDate(item) {
  const endY = item['end-date']?.year?.value
  if (endY) return endY
  return 'In progress'
}
function workYear(w) { return w['publication-date']?.year?.value || '\u2014' }
function cleanType(t) { return t ? t.replace(/-/g, ' ') : '' }
function getDoiUrl(extIds) {
  if (!extIds?.['external-id']) return null
  const doi = extIds['external-id'].find(e => e['external-id-type'] === 'doi')
  if (doi) { const v = doi['external-id-value']; return v.startsWith('http') ? v : `https://doi.org/${v}` }
  const u = extIds['external-id'].find(e => e['external-id-url']?.value)
  return u?.['external-id-url']?.value || null
}

// ─── Icons ───────────────────────────────
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

// ─── Snake Timeline ──────────────────────
function SnakeTimeline({ items, type }) {
  return (
    <div className="snake">
      {items.map((item, i) => {
        const isLeft = i % 2 === 0
        const isLast = i === items.length - 1
        const isCurrent = type === 'xp' ? item.current : false

        return (
          <div className="snake-row" key={i}>
            {/* The connector lines */}
            <div className={`snake-track ${isLeft ? 'left' : 'right'} ${isLast ? 'last' : ''}`}>
              <div className={`snake-node ${isCurrent ? 'now' : ''}`} />
            </div>
            {/* The card */}
            <div className={`snake-card ${isLeft ? 'left' : 'right'}`}>
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
            </div>
          </div>
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
      <div className="loading-spinner"/>
      <div className="loading-text">$ curl pub.orcid.org ...</div>
    </div>
  )
  if (error) return (
    <div className="error-screen">
      <h2>Connection Failed</h2><p>{error}</p>
      <button className="retry-btn" onClick={fetchData}>Retry</button>
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
        <div className="hero-grid"/>
        <div className="hero-inner">
          <div className="hero-prompt">researcher / engineer / builder</div>
          <h1 className="hero-name">
            {givenName}<br/><span className="g">{familyName}</span>
          </h1>
          {bio ? (
            <p className="hero-tagline">{bio}</p>
          ) : (
            <p className="hero-tagline">
              <strong>Geneticist</strong> and <strong>bioinformatician</strong> building
              tools at the intersection of genomics, CRISPRi, and computational biology.
            </p>
          )}
          <div className="hero-stats">
            <span className="stat stat--id">
              <a href={`https://orcid.org/${ORCID_ID}`} target="_blank" rel="noopener noreferrer">
                ORCID {ORCID_ID}
              </a>
            </span>
            <span className="stat">{LINKEDIN.location}</span>
            <span className="stat"><span className="val">{works.length}</span> publications</span>
            <span className="stat"><span className="val">{LINKEDIN.experience.length}</span> roles</span>
          </div>
        </div>
      </header>

      <nav className="nav">
        <div className="nav-inner">
          <a className="nav-a" href="#xp">Experience</a>
          <a className="nav-a" href="#edu">Education</a>
          <a className="nav-a" href="#pub">Publications</a>
          {allKeywords.length > 0 && <a className="nav-a" href="#kw">Skills</a>}
          {allLinks.length > 0 && <a className="nav-a" href="#links">Links</a>}
        </div>
      </nav>

      <section className="section" id="xp">
        <div className="sec-head">
          <span className="sec-label">0{++n}</span>
          <h2 className="sec-title">Experience</h2>
          <div className="sec-line"/>
        </div>
        <SnakeTimeline items={LINKEDIN.experience} type="xp"/>
      </section>

      {educations.length > 0 && (
        <section className="section" id="edu">
          <div className="sec-head">
            <span className="sec-label">0{++n}</span>
            <h2 className="sec-title">Education</h2>
            <div className="sec-line"/>
          </div>
          <SnakeTimeline items={educations} type="edu"/>
        </section>
      )}

      {works.length > 0 && (
        <section className="section" id="pub">
          <div className="sec-head">
            <span className="sec-label">0{++n}</span>
            <h2 className="sec-title">Publications</h2>
            <div className="sec-line"/>
            <span className="sec-count">{works.length}</span>
          </div>
          <div className="pub-list">
            {works.map((w, i) => {
              const title = w.title?.title?.value || 'Untitled'
              const journal = w['journal-title']?.value || ''
              const type = cleanType(w.type)
              const year = workYear(w)
              const doi = getDoiUrl(w['external-ids'])
              return (
                <div className="pub" key={i}>
                  <div className="pub-y">{year}</div>
                  <div>
                    <div className="pub-t">{title}</div>
                    {journal && <div className="pub-j">{journal}</div>}
                    {type && <div className="pub-type">{type}</div>}
                  </div>
                  {doi && (
                    <div className="pub-doi">
                      <a href={doi} target="_blank" rel="noopener noreferrer" title="View"><Arrow/></a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {allKeywords.length > 0 && (
        <section className="section" id="kw">
          <div className="sec-head">
            <span className="sec-label">0{++n}</span>
            <h2 className="sec-title">Research Interests &amp; Skills</h2>
            <div className="sec-line"/>
          </div>
          <div className="kw-wrap">
            {allKeywords.map((k, i) => <span className="kw" key={i}>{k}</span>)}
          </div>
        </section>
      )}

      {allLinks.length > 0 && (
        <section className="section" id="links">
          <div className="sec-head">
            <span className="sec-label">0{++n}</span>
            <h2 className="sec-title">Links</h2>
            <div className="sec-line"/>
          </div>
          <div className="links-list">
            {allLinks.map((l, i) => (
              <a className="lnk" href={l.url} target="_blank" rel="noopener noreferrer" key={i}>
                <div className="lnk-icon"><Chain/></div>
                <div>
                  <div className="lnk-name">{l.name || 'Website'}</div>
                  <div className="lnk-url">{l.url?.replace(/^https?:\/\//, '')}</div>
                </div>
              </a>
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
