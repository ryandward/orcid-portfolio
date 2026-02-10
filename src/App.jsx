import { useState, useEffect } from 'react'

const ORCID_ID = '0000-0001-9537-2461'
const API_BASE = `https://pub.orcid.org/v3.0/${ORCID_ID}`
const HEADERS = { Accept: 'application/json' }

// ─── LinkedIn data (from export) ─────────
const LINKEDIN = {
  headline: "PhD Geneticist",
  location: "Santa Barbara, California",
  experience: [
    {
      title: "Founding Scientist",
      org: "Stealth Startup",
      start: "Feb 2026", end: null, current: true,
      location: null,
    },
    {
      title: "Senior Scientist",
      org: "Temporal Agriculture",
      start: "Jan 2025", end: "Jan 2026",
      location: "Santa Barbara, CA",
    },
    {
      title: "Postdoctoral Researcher",
      org: "University of Wisconsin–Madison",
      start: "Dec 2024", end: "Jan 2025",
      location: null,
    },
    {
      title: "PhD Researcher",
      org: "University of Wisconsin–Madison",
      start: "Sep 2019", end: "Dec 2024",
      location: null,
    },
    {
      title: "Bioinformatics Intern",
      org: "Temporal Agriculture",
      start: "May 2024", end: "Jul 2024",
      location: "Santa Barbara, CA",
    },
    {
      title: "Emergency Department Scribe",
      org: "MountainView Regional Medical Center",
      start: "Mar 2017", end: "Aug 2019",
      location: "Las Cruces, NM",
    },
    {
      title: "Policy Analyst",
      org: "New Mexico Department of Agriculture",
      start: "Nov 2012", end: "Jan 2017",
      location: "Las Cruces, NM",
    },
    {
      title: "Intelligence Analyst",
      org: "POSIT",
      start: "May 2009", end: "May 2012",
      location: "Las Cruces, NM",
    },
  ],
  skills: ["Statistical Software", "Next-Generation Sequencing (NGS)", "HIPAA"],
  links: [
    { name: "LinkedIn", url: "https://www.linkedin.com/in/ryanw-346889253" },
    { name: "Stack Overflow", url: "https://stackoverflow.com/users/714178" },
  ],
}

// ─── Helpers ─────────────────────────────
function fmtDate(dateObj) {
  if (!dateObj) return null
  const y = dateObj.year?.value
  const m = dateObj.month?.value
  if (!y) return null
  if (m) {
    const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${mo[parseInt(m) - 1]} ${y}`
  }
  return String(y)
}

function eduDateRange(item) {
  const start = fmtDate(item['start-date'])
  const end = fmtDate(item['end-date'])
  if (!start && !end) return ''
  if (!start) return `— ${end}`
  if (!end) return `${start} — Present`
  return `${start} — ${end}`
}

function workYear(work) {
  return work['publication-date']?.year?.value || '—'
}

function cleanType(type) {
  return type ? type.replace(/-/g, ' ') : ''
}

function getDoiUrl(extIds) {
  if (!extIds?.['external-id']) return null
  const doi = extIds['external-id'].find(e => e['external-id-type'] === 'doi')
  if (doi) {
    const v = doi['external-id-value']
    return v.startsWith('http') ? v : `https://doi.org/${v}`
  }
  const u = extIds['external-id'].find(e => e['external-id-url']?.value)
  return u?.['external-id-url']?.value || null
}

// ─── Icons ───────────────────────────────
const ArrowIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"/>
    <polyline points="7 7 17 7 17 17"/>
  </svg>
)
const LinkIconSvg = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
)

// ─── Section Component ───────────────────
function Section({ id, num, title, count, children }) {
  return (
    <section className="section" id={id}>
      <div className="section-head">
        <span className="section-num">{num}.</span>
        <h2 className="section-title">{title}</h2>
        {count != null && <span className="section-count">{count}</span>}
      </div>
      {children}
    </section>
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
    setLoading(true)
    setError(null)
    try {
      const [personRes, worksRes, educationsRes] = await Promise.all([
        fetch(`${API_BASE}/person`, { headers: HEADERS }),
        fetch(`${API_BASE}/works`, { headers: HEADERS }),
        fetch(`${API_BASE}/educations`, { headers: HEADERS }),
      ])
      if (!personRes.ok) throw new Error('Failed to fetch ORCID data')

      const personData = await personRes.json()
      const worksData = await worksRes.json()
      const educationsData = await educationsRes.json()

      setPerson(personData)

      // Works: flatten, sort by year desc
      const allWorks = (worksData.group || [])
        .map(g => g['work-summary']?.[0])
        .filter(Boolean)
        .sort((a, b) => (parseInt(workYear(b)) || 0) - (parseInt(workYear(a)) || 0))
      setWorks(allWorks)

      // Education
      const eduGroups = educationsData['affiliation-group'] || []
      const edus = eduGroups
        .map(g => g.summaries?.[0]?.['education-summary'])
        .filter(Boolean)
        .sort((a, b) =>
          (parseInt(b['start-date']?.year?.value) || 0) -
          (parseInt(a['start-date']?.year?.value) || 0)
        )
      setEducations(edus)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"/>
        <div className="loading-text">Fetching ORCID profile…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button className="retry-btn" onClick={fetchData}>Retry</button>
      </div>
    )
  }

  const name = person?.name
  const givenName = name?.['given-names']?.value || ''
  const familyName = name?.['family-name']?.value || ''
  const bio = person?.biography?.content || ''
  const keywords = (person?.keywords?.keyword || []).map(k => k.content)
  const orcidUrls = (person?.['researcher-urls']?.['researcher-url'] || []).map(
    u => ({ name: u['url-name'], url: u.url?.value })
  )

  // Merge links: LinkedIn links + ORCID researcher-urls, deduplicated
  const allLinks = [...LINKEDIN.links]
  orcidUrls.forEach(ou => {
    if (!allLinks.some(l => l.url === ou.url)) allLinks.push(ou)
  })

  // Merge skills: LinkedIn skills + ORCID keywords, deduplicated
  const allKeywords = [...new Set([...keywords, ...LINKEDIN.skills])]

  let secNum = 0

  // Group experience by org for visual clarity
  const experience = LINKEDIN.experience

  return (
    <div className="portfolio">
      {/* ═══ HERO ═══ */}
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">{LINKEDIN.headline}</div>
          <h1 className="hero-name">
            {givenName} <em>{familyName}</em>
          </h1>
          {bio && <p className="hero-bio">{bio}</p>}
          <div className="hero-chips">
            <span className="chip chip--accent">
              <span className="orcid-icon">iD</span>
              <a href={`https://orcid.org/${ORCID_ID}`} target="_blank" rel="noopener noreferrer">
                {ORCID_ID}
              </a>
            </span>
            <span className="chip">{LINKEDIN.location}</span>
            <span className="chip">{works.length} publications</span>
          </div>
        </div>
      </header>

      {/* ═══ NAV ═══ */}
      <nav className="nav-strip">
        <div className="nav-inner">
          <a className="nav-link" href="#experience">Experience</a>
          <a className="nav-link" href="#education">Education</a>
          <a className="nav-link" href="#publications">Publications</a>
          {allKeywords.length > 0 && <a className="nav-link" href="#interests">Interests</a>}
          {allLinks.length > 0 && <a className="nav-link" href="#links">Links</a>}
        </div>
      </nav>

      {/* ═══ EXPERIENCE (LinkedIn) ═══ */}
      <Section id="experience" num={`0${++secNum}`} title="Experience" count={`${experience.length} roles`}>
        <div className="timeline">
          {experience.map((job, i) => (
            <div className={`timeline-item ${job.current ? 'current' : ''}`} key={i}>
              <div className="timeline-dot"/>
              <div className="timeline-dates">
                {job.start} — {job.end || 'Present'}
                {job.location && <span style={{marginLeft: '0.75rem', opacity: 0.6}}>{job.location}</span>}
              </div>
              <div className="timeline-role">{job.title}</div>
              <div className="timeline-org">{job.org}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══ EDUCATION (ORCID) ═══ */}
      {educations.length > 0 && (
        <Section id="education" num={`0${++secNum}`} title="Education">
          <div className="timeline">
            {educations.map((edu, i) => (
              <div className={`timeline-item ${!edu['end-date']?.year?.value ? 'current' : ''}`} key={i}>
                <div className="timeline-dot"/>
                <div className="timeline-dates">{eduDateRange(edu)}</div>
                <div className="timeline-role">
                  {edu['role-title'] || edu['department-name'] || 'Student'}
                </div>
                <div className="timeline-org">{edu.organization?.name}</div>
                {edu['role-title'] && edu['department-name'] && (
                  <div className="timeline-dept">{edu['department-name']}</div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ PUBLICATIONS (ORCID) ═══ */}
      {works.length > 0 && (
        <Section id="publications" num={`0${++secNum}`} title="Publications" count={`${works.length} works`}>
          <div className="pub-list">
            {works.map((work, i) => {
              const title = work.title?.title?.value || 'Untitled'
              const journal = work['journal-title']?.value || ''
              const type = cleanType(work.type)
              const year = workYear(work)
              const doiUrl = getDoiUrl(work['external-ids'])
              return (
                <div className="pub-item" key={i}>
                  <div className="pub-year">{year}</div>
                  <div>
                    <div className="pub-title">{title}</div>
                    {journal && <div className="pub-journal">{journal}</div>}
                    {type && <div className="pub-type">{type}</div>}
                  </div>
                  {doiUrl && (
                    <div className="pub-link">
                      <a href={doiUrl} target="_blank" rel="noopener noreferrer" title="View publication">
                        <ArrowIcon/>
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* ═══ KEYWORDS / INTERESTS ═══ */}
      {allKeywords.length > 0 && (
        <Section id="interests" num={`0${++secNum}`} title="Research Interests &amp; Skills">
          <div className="keywords-wrap">
            {allKeywords.map((kw, i) => (
              <span className="kw" key={i}>{kw}</span>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ LINKS ═══ */}
      {allLinks.length > 0 && (
        <Section id="links" num={`0${++secNum}`} title="Links">
          <div className="links-list">
            {allLinks.map((link, i) => (
              <a className="link-row" href={link.url} target="_blank" rel="noopener noreferrer" key={i}>
                <div className="link-row-icon"><LinkIconSvg/></div>
                <div>
                  <div className="link-row-name">{link.name || 'Website'}</div>
                  <div className="link-row-url">{link.url?.replace(/^https?:\/\//, '')}</div>
                </div>
              </a>
            ))}
          </div>
        </Section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="footer-left">
          Publications via{' '}
          <a href={`https://orcid.org/${ORCID_ID}`} target="_blank" rel="noopener noreferrer">
            ORCID
          </a>
          {' '}· Experience via LinkedIn export
        </div>
        <div className="footer-right">
          Auto-updates publications when you update ORCID
        </div>
      </footer>
    </div>
  )
}
