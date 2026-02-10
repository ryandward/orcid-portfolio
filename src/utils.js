export function fmtEduDate(item) { return item['end-date']?.year?.value || 'In progress' }
export function workYear(w) { return w['publication-date']?.year?.value || '\u2014' }
export function cleanType(t) { return t ? t.replace(/-/g, ' ') : '' }
export function getDoiUrl(extIds) {
  if (!extIds?.['external-id']) return null
  const doi = extIds['external-id'].find(e => e['external-id-type'] === 'doi')
  if (doi) { const v = doi['external-id-value']; return v.startsWith('http') ? v : `https://doi.org/${v}` }
  const u = extIds['external-id'].find(e => e['external-id-url']?.value)
  return u?.['external-id-url']?.value || null
}
