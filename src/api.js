import { API_BASE, HEADERS, SE_USER_ID, SE_API, SE_KEY, SE_FILTER } from './constants'
import { workYear } from './utils'

const SE_CACHE_KEY = 'se_cache_v4'
const SE_CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function fetchStackExchange() {
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

export async function fetchOrcidData() {
  const [pRes, wRes, eRes] = await Promise.all([
    fetch(`${API_BASE}/person`, { headers: HEADERS }),
    fetch(`${API_BASE}/works`, { headers: HEADERS }),
    fetch(`${API_BASE}/educations`, { headers: HEADERS }),
  ])
  if (!pRes.ok) throw new Error('ORCID API returned ' + pRes.status)

  const person = await pRes.json()
  const wd = await wRes.json()
  const summaries = (wd.group || []).map(g => g['work-summary']?.[0]).filter(Boolean)
    .sort((a, b) => (parseInt(workYear(b)) || 0) - (parseInt(workYear(a)) || 0))
  const works = await Promise.all(summaries.map(async w => {
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

  const ed = await eRes.json()
  const educations = (ed['affiliation-group'] || []).map(g => g.summaries?.[0]?.['education-summary']).filter(Boolean)
    .sort((a, b) =>
      (parseInt(b['end-date']?.year?.value || b['start-date']?.year?.value) || 0) -
      (parseInt(a['end-date']?.year?.value || a['start-date']?.year?.value) || 0)
    )

  return { person, works, educations }
}
