import { fmtEduDate } from '../utils'
import Reveal from './Reveal'
import GlowCard from './GlowCard'

export default function SnakeTimeline({ items, type }) {
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
