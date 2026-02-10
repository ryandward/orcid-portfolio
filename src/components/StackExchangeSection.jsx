import Reveal from './Reveal'
import GlowCard from './GlowCard'
import { Arrow } from './Icons'

function decodeHtml(s) {
  const el = document.createElement('textarea')
  el.innerHTML = s
  return el.value
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'm'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

function SiteGroup({ site, delay }) {
  const { questions = [], answers = [] } = site
  const rawName = site.site_name || site.site_url?.replace(/^https?:\/\//, '').replace(/\.com$/, '')
  const siteName = decodeHtml(rawName)

  return (
    <div className="se-site-group">
      <Reveal delay={delay}>
        <div className="se-site-header">
          <span className="se-site-name">{siteName}</span>
          <span className="se-site-rep">{formatNumber(site.reputation)} rep</span>
          <div className="se-site-line" />
          <span className="se-site-stats">
            {site.question_count > 0 && <span>{site.question_count} Q</span>}
            {site.answer_count > 0 && <span>{site.answer_count} A</span>}
          </span>
        </div>
      </Reveal>

      <div className="se-list">
        {questions.map((q, i) => (
          <Reveal key={q.question_id} delay={delay + (i + 1) * 60}>
            <GlowCard className="se-card" href={q.link}>
              <div className="se-votes">
                <span className="se-score">{q.score}</span>
                <span className="se-vote-label">votes</span>
              </div>
              <div className="se-body">
                <div className="se-meta">
                  <span className="se-type-badge se-type-q">Q</span>
                  <span className="se-views">{formatNumber(q.view_count)} views</span>
                </div>
                <h3 className="se-title" dangerouslySetInnerHTML={{ __html: q.title }} />
                {q.tags && q.tags.length > 0 && (
                  <div className="se-tags">
                    {q.tags.slice(0, 4).map(t => (
                      <span key={t} className="se-tag">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="se-arrow"><Arrow /></div>
            </GlowCard>
          </Reveal>
        ))}
        {answers.map((a, i) => (
          <Reveal key={a.answer_id} delay={delay + (questions.length + i + 1) * 60}>
            <GlowCard className="se-card" href={a.link}>
              <div className="se-votes">
                <span className="se-score">{a.score}</span>
                <span className="se-vote-label">votes</span>
              </div>
              <div className="se-body">
                <div className="se-meta">
                  <span className={`se-type-badge se-type-a${a.is_accepted ? ' se-type-accepted' : ''}`}>A</span>
                  {a.is_accepted && <span className="se-accepted">accepted</span>}
                </div>
                <h3 className="se-title">
                  {a.question_title ? (
                    <span dangerouslySetInnerHTML={{ __html: a.question_title }} />
                  ) : (
                    <span>Answer #{a.answer_id}</span>
                  )}
                </h3>
              </div>
              <div className="se-arrow"><Arrow /></div>
            </GlowCard>
          </Reveal>
        ))}
      </div>
    </div>
  )
}

export default function StackExchangeSection({ seData }) {
  if (!seData || seData.length === 0) return null

  const totalRep = seData.reduce((sum, s) => sum + (s.reputation || 0), 0)

  return (
    <>
      {seData.map((site, i) => (
        <SiteGroup key={site.site_url} site={site} delay={i * 100} />
      ))}
      <Reveal>
        <div className="se-total">
          {formatNumber(totalRep)} total reputation across {seData.length} sites
        </div>
      </Reveal>
    </>
  )
}
