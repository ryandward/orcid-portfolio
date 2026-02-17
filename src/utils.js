export function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'm'
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(n)
}

export function fmtEduDate(item) { return item['end-date']?.year?.value || 'In progress' }
export function workYear(w) { return w['publication-date']?.year?.value || '\u2014' }
export function cleanType(t) { return t ? t.replace(/-/g, ' ') : '' }
// Fix missing spaces from Crossref stripping <italic> JATS tags.
// When JATS XML like <italic>P. aeruginosa</italic>foo gets flattened,
// the space after the closing tag is lost. We patch known species epithets.
const SPECIES_EPITHETS = [
  // ESKAPE pathogens
  'faecium', 'aureus', 'aeruginosa', 'baumannii', 'cloacae',
  // Other common bacteria
  'coli', 'pneumoniae', 'tuberculosis', 'subtilis', 'cereus',
  'anthracis', 'pyogenes', 'agalactiae', 'marcescens', 'mirabilis',
  'enterica', 'typhimurium', 'flexneri', 'sonnei', 'difficile',
  'perfringens', 'botulinum', 'trachomatis', 'gonorrhoeae',
  'meningitidis', 'pylori', 'cholera', 'pestis',
  // Common model organisms
  'cerevisiae', 'melanogaster', 'elegans', 'thaliana', 'musculus',
  'rerio', 'sapiens',
]
const EPITHET_RE = new RegExp(`(${SPECIES_EPITHETS.join('|')})(?=[a-z])`, 'gi')

export function fixTitle(t) {
  if (!t) return t
  return t.replace(EPITHET_RE, '$1 ')
}

export function getDoiUrl(extIds) {
  if (!extIds?.['external-id']) return null
  const doi = extIds['external-id'].find(e => e['external-id-type'] === 'doi')
  if (doi) { const v = doi['external-id-value']; return v.startsWith('http') ? v : `https://doi.org/${v}` }
  const u = extIds['external-id'].find(e => e['external-id-url']?.value)
  return u?.['external-id-url']?.value || null
}
