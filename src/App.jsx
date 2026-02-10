import { useState, useEffect } from 'react'

const ORCID_ID = '0000-0001-9537-2461'
const API_BASE = `https://pub.orcid.org/v3.0/${ORCID_ID}`
const HEADERS = { Accept: 'application/json' }

// ─── Helpers ─────────────────────────────
function formatDate(dateObj) {
  if (!dateObj) return null
  const y = dateObj.year?.value
  const m = dateObj.month?.value
  if (!y) return null
  if (m) return `${y}-${String(m).padStart(2, '0')}`
  return y
}

function workYear(work) {
  const date = work['publication-date']
  return date?.year?.value || '—'
}

function cleanType(type) {
  if (!type) return ''
  return type.replace(/-/g, ' ')
}

function getDoiUrl(extIds) {
  if (!extIds?.['external-id']) return null
  const doi = extIds['external-id'].find(
    (e) => e['external-id-type'] === 'doi'
  )
  if (doi) {
    const val = doi['external-id-value']
    return val.startsWith('http') ? val : `https://doi.org/${val}`
  }
  const url = extIds['external-id'].find(
    (e) => e['external-id-url']?.value
  )
  return url?.['external-id-url']?.value || null
}

// ─── Arrow Icon ──────────────────────────
function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

// ─── Main App ────────────────────────────
export default function App() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [person, setPerson] = useState(null)
  const [works, setWorks] = useState([])
  const [employments, setEmployments] = useState([])
  const [educations, setEducations] = useState([])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [personRes, worksRes, employmentsRes, educationsRes] =
        await Promise.all([
          fetch(`${API_BASE}/person`, { headers: HEADERS }),
          fetch(`${API_BASE}/works`, { headers: HEADERS }),
          fetch(`${API_BASE}/employments`, { headers: HEADERS }),
          fetch(`${API_BASE}/educations`, { headers: HEADERS }),
        ])

      if (!personRes.ok) throw new Error('Failed to fetch ORCID data')

      const personData = await personRes.json()
      const worksData = await worksRes.json()
      const employmentsData = await employmentsRes.json()
      const educationsData = await educationsRes.json()

      setPerson(personData)

      // Parse works — flatten groups, dedupe by title, sort by year desc
      const allWorks = (worksData.group || [])
        .map((g) => g['work-summary']?.[0])
        .filter(Boolean)
        .sort((a, b) => {
          const ya = parseInt(workYear(a)) || 0
          const yb = parseInt(workYear(b)) || 0
          return yb - ya
        })
      setWorks(allWorks)

      // Parse employments
      const empGroups = employmentsData['affiliation-group'] || []
      const emps = empGroups
        .map((g) => g.summaries?.[0]?.['employment-summary'])
        .filter(Boolean)
        .sort((a, b) => {
          const ya = parseInt(a['start-date']?.year?.value) || 0
          const yb = parseInt(b['start-date']?.year?.value) || 0
          return yb - ya
        })
      setEmployments(emps)

      // Parse educations
      const eduGroups = educationsData['affiliation-group'] || []
      const edus = eduGroups
        .map((g) => g.summaries?.[0]?.['education-summary'])
        .filter(Boolean)
        .sort((a, b) => {
          const ya = parseInt(a['start-date']?.year?.value) || 0
          const yb = parseInt(b['start-date']?.year?.value) || 0
          return yb - ya
        })
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
        <div className="loading-spinner" />
        <div className="loading-text">Fetching ORCID profile…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button className="retry-btn" onClick={fetchData}>
          Retry
        </button>
      </div>
    )
  }

  // ── Extract person info ────────────────
  const name = person?.name
  const givenName = name?.['given-names']?.value || ''
  const familyName = name?.['family-name']?.value || ''
  const bio = person?.biography?.content || ''
  const keywords = (person?.keywords?.keyword || []).map(
    (k) => k.content
  )
  const urls = (person?.['researcher-urls']?.['researcher-url'] || []).map(
    (u) => ({ name: u['url-name'], url: u.url?.value })
  )
  const country =
    person?.addresses?.address?.[0]?.country?.value || null

  // Determine section numbering
  let sectionNum = 0

  return (
    <div className="portfolio">
      {/* ═══ HERO ═══ */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-label">Researcher Profile</div>
          <h1 className="hero-name">
            {givenName} <span className="accent">{familyName}</span>
          </h1>
          {bio && <p className="hero-bio">{bio}</p>}
          <div className="hero-meta">
            <div className="meta-chip orcid-badge">
              <a
                href={`https://orcid.org/${ORCID_ID}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                ORCID {ORCID_ID}
              </a>
            </div>
            {country && (
              <div className="meta-chip">{country}</div>
            )}
            {works.length > 0 && (
              <div className="meta-chip">
                {works.length} Publication{works.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ═══ EMPLOYMENT ═══ */}
      {employments.length > 0 && (
        <section className="section">
          <div className="section-header">
            <span className="section-number">{String(++sectionNum).padStart(2, '0')}</span>
            <h2 className="section-title">Experience</h2>
            <div className="section-line" />
          </div>
          <div className="affiliations-grid">
            {employments.map((emp, i) => {
              const start = formatDate(emp['start-date'])
              const end = formatDate(emp['end-date']) || 'Present'
              return (
                <div className="affiliation-card" key={i}>
                  <div className="affiliation-dates">
                    {start} — {end}
                  </div>
                  <div className="affiliation-role">
                    {emp['role-title'] || 'Researcher'}
                  </div>
                  <div className="affiliation-org">
                    {emp.organization?.name}
                  </div>
                  {emp['department-name'] && (
                    <div className="affiliation-dept">
                      {emp['department-name']}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {employments.length > 0 && <div className="divider" />}

      {/* ═══ EDUCATION ═══ */}
      {educations.length > 0 && (
        <section className="section">
          <div className="section-header">
            <span className="section-number">{String(++sectionNum).padStart(2, '0')}</span>
            <h2 className="section-title">Education</h2>
            <div className="section-line" />
          </div>
          <div className="affiliations-grid">
            {educations.map((edu, i) => {
              const start = formatDate(edu['start-date'])
              const end = formatDate(edu['end-date']) || 'Present'
              return (
                <div className="affiliation-card" key={i}>
                  <div className="affiliation-dates">
                    {start} — {end}
                  </div>
                  <div className="affiliation-role">
                    {edu['role-title'] || edu['department-name'] || 'Student'}
                  </div>
                  <div className="affiliation-org">
                    {edu.organization?.name}
                  </div>
                  {edu['role-title'] && edu['department-name'] && (
                    <div className="affiliation-dept">
                      {edu['department-name']}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {educations.length > 0 && <div className="divider" />}

      {/* ═══ PUBLICATIONS ═══ */}
      {works.length > 0 && (
        <section className="section">
          <div className="section-header">
            <span className="section-number">{String(++sectionNum).padStart(2, '0')}</span>
            <h2 className="section-title">Publications</h2>
            <div className="section-line" />
          </div>
          <div className="works-list">
            {works.map((work, i) => {
              const title =
                work.title?.title?.value || 'Untitled'
              const journal =
                work['journal-title']?.value || ''
              const type = cleanType(work.type)
              const year = workYear(work)
              const doiUrl = getDoiUrl(work['external-ids'])

              return (
                <div className="work-card" key={i}>
                  <div className="work-year">{year}</div>
                  <div className="work-info">
                    <h3>{title}</h3>
                    {journal && (
                      <div className="work-journal">{journal}</div>
                    )}
                    {type && <div className="work-type">{type}</div>}
                  </div>
                  {doiUrl && (
                    <div className="work-link">
                      <a
                        href={doiUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View publication"
                      >
                        <ArrowIcon />
                      </a>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {works.length > 0 && <div className="divider" />}

      {/* ═══ KEYWORDS ═══ */}
      {keywords.length > 0 && (
        <section className="section">
          <div className="section-header">
            <span className="section-number">{String(++sectionNum).padStart(2, '0')}</span>
            <h2 className="section-title">Research Interests</h2>
            <div className="section-line" />
          </div>
          <div className="keywords-cloud">
            {keywords.map((kw, i) => (
              <span className="keyword-tag" key={i}>
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}

      {keywords.length > 0 && urls.length > 0 && <div className="divider" />}

      {/* ═══ LINKS ═══ */}
      {urls.length > 0 && (
        <section className="section">
          <div className="section-header">
            <span className="section-number">{String(++sectionNum).padStart(2, '0')}</span>
            <h2 className="section-title">Links</h2>
            <div className="section-line" />
          </div>
          <div className="links-grid">
            {urls.map((link, i) => (
              <a
                className="link-card"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                key={i}
              >
                <div className="link-icon">
                  <LinkIcon />
                </div>
                <div>
                  <div className="link-label">{link.name || 'Website'}</div>
                  <div className="link-url">
                    {link.url?.replace(/^https?:\/\//, '')}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="divider" />

      {/* ═══ FOOTER ═══ */}
      <footer className="footer">
        <div className="footer-orcid">
          Data sourced live from{' '}
          <a
            href={`https://orcid.org/${ORCID_ID}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            orcid.org/{ORCID_ID}
          </a>
        </div>
        <div className="footer-note">
          Updates automatically when you update your ORCID profile
        </div>
      </footer>
    </div>
  )
}
