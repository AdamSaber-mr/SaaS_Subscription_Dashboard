// Number / currency formatting helpers.
// Tabular numbers in the UI keep these aligned; these just produce the strings.
import { MONTHS_SHORT } from './i18n.js'

export function usd(n) {
  const neg = n < 0
  n = Math.round(Math.abs(n))
  return (neg ? '-$' : '$') + n.toLocaleString('en-US')
}

export function usdShort(n) {
  const neg = n < 0
  n = Math.abs(n)
  let s
  if (n >= 1000) s = '$' + (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k'
  else s = '$' + Math.round(n)
  return (neg ? '-' : '') + s
}

export function pct1(n) {
  return (n * 100).toFixed(1) + '%'
}

export function delta(cur, prev) {
  if (!prev) return { str: '—', pos: true }
  const d = (cur - prev) / prev
  return { str: (d >= 0 ? '+' : '') + (d * 100).toFixed(1) + '%', pos: d >= 0 }
}

// SVG path for a small inline sparkline (viewBox 120x34).
export function spark(arr) {
  const W = 120
  const H = 34
  const mx = Math.max(...arr) * 1.05 || 1
  const mn = Math.min(...arr) * 0.96
  const range = mx - mn || 1
  return (
    'M' +
    arr
      .map(
        (v, i) =>
          ((i / (arr.length - 1)) * W).toFixed(1) +
          ',' +
          (H - ((v - mn) / range) * H).toFixed(1),
      )
      .join(' L')
  )
}

// '2025-03-04' → 'Mar 04, 2025' (en) / '04 mrt 2025' (nl)
export function fmtDate(iso, lang = 'en') {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const month = MONTHS_SHORT[lang][Number(m) - 1]
  return lang === 'nl' ? d + ' ' + month + ' ' + y : month + ' ' + d + ', ' + y
}

// '2025-03-04' → "Mar '25" / "mrt '25"
export function fmtMonth(iso, lang = 'en') {
  if (!iso) return ''
  const [y, m] = iso.split('-')
  return MONTHS_SHORT[lang][Number(m) - 1] + " '" + y.slice(2)
}

export function initial(n) {
  const w = n
    .replace(/[^A-Za-z ]/g, '')
    .trim()
    .split(/\s+/)
  return ((w[0] || '?')[0] + ((w[1] || '')[0] || '')).toUpperCase()
}

// Deterministic gradient avatar from a name.
export function avatarStyle(n, size) {
  const hues = [262, 210, 160, 28, 340, 190]
  let h = 0
  for (let i = 0; i < n.length; i++) h = (h + n.charCodeAt(i)) % hues.length
  const hue = hues[h]
  return {
    width: size + 'px',
    height: size + 'px',
    borderRadius: Math.round(size * 0.3) + 'px',
    flex: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: Math.round(size * 0.36) + 'px',
    fontWeight: 600,
    color: '#fff',
    background: `linear-gradient(135deg,oklch(0.62 0.13 ${hue}),oklch(0.5 0.14 ${hue}))`,
  }
}

export function hexA(hex, a) {
  hex = (hex || '#6E56CF').replace('#', '')
  if (hex.length === 3)
    hex = hex
      .split('')
      .map((x) => x + x)
      .join('')
  const n = parseInt(hex, 16)
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
}
