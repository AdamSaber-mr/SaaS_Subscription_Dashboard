import { useMemo, useState } from 'react'
import { useDashboard } from '../../store/DashboardContext.jsx'
import { chartColors } from '../../lib/theme.js'
import { usd, usdShort } from '../../lib/format.js'
import { useSize, niceScale, roundedTopRect, ChartTooltip } from './ChartBits.jsx'

const H = 240
const PAD = { top: 26, right: 8, bottom: 30, left: 40 }

// Hand-built diverging bars around an emphasized zero baseline: green adds
// revenue, red removes it. Four bars, each its own story, so every cap wears
// its value.
export default function MovementsChart({ m }) {
  const { theme, accent, t } = useDashboard()
  const c = chartColors(theme, accent)
  const [wrapRef, width] = useSize()
  const [hover, setHover] = useState(null)

  const rows = [
    { label: t('dash.newCustomers'), v: m.newM },
    { label: t('dash.upgrades'), v: m.expM },
    { label: t('dash.downgrades'), v: -m.conM },
    { label: t('dash.cancellations'), v: -m.chuM },
  ]

  const iw = Math.max(0, width - PAD.left - PAD.right)
  const ih = H - PAD.top - PAD.bottom
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.v)), 1)
  const { max } = useMemo(() => niceScale(maxAbs, 3), [maxAbs])
  const negMax = Math.min(...rows.map((r) => r.v), 0)
  // scale: positives above the zero line, negatives below, shared $/px rate
  const negSpan = Math.abs(negMax) > 0 ? Math.max(Math.abs(negMax) * 1.25, max * 0.28) : 0
  const total = max + negSpan
  const zeroY = PAD.top + (max / total) * ih
  const scale = ih / total

  const band = iw / rows.length
  const barW = Math.min(46, band * 0.4)
  const x = (i) => PAD.left + i * band + (band - barW) / 2

  if (!width) return <div ref={wrapRef} style={{ height: H + 'px' }} />

  return (
    <div ref={wrapRef} style={{ position: 'relative', height: H + 'px' }}>
      <svg width={width} height={H} role="img" aria-label={t('dash.movements')} style={{ display: 'block' }}>
        {/* light guides + emphasized zero baseline */}
        {[max, max / 2].map((tk) => (
          <g key={tk}>
            <line x1={PAD.left} x2={PAD.left + iw} y1={zeroY - tk * scale} y2={zeroY - tk * scale} stroke="var(--border,#ececef)" strokeWidth="1" />
            <text x={PAD.left - 8} y={zeroY - tk * scale + 3.5} textAnchor="end" fontSize="10.5" fill="var(--text-3,#9a9aa6)">
              {'$' + (tk >= 1000 ? tk / 1000 + 'k' : tk)}
            </text>
          </g>
        ))}
        <line x1={PAD.left} x2={PAD.left + iw} y1={zeroY} y2={zeroY} stroke="var(--text-3,#9a9aa6)" strokeWidth="1" opacity="0.65" />

        {rows.map((r, i) => {
          const hPx = Math.max(3, Math.abs(r.v) * scale)
          const up = r.v >= 0
          const color = up ? c.pos : c.neg
          const isHover = hover === i
          // rounded at the data end: top corners for gains, bottom for losses
          const bx = x(i)
          const rr = Math.min(4, barW / 2, hPx)
          const d = up
            ? roundedTopRect(bx, zeroY - hPx, barW, hPx, 4)
            : `M${bx},${zeroY} L${bx + barW},${zeroY} L${bx + barW},${zeroY + hPx - rr} Q${bx + barW},${zeroY + hPx} ${bx + barW - rr},${zeroY + hPx} L${bx + rr},${zeroY + hPx} Q${bx},${zeroY + hPx} ${bx},${zeroY + hPx - rr} Z`
          return (
            <path
              key={i}
              d={d}
              fill={color}
              opacity={isHover ? 0.82 : 1}
              style={{
                transformBox: 'fill-box',
                transformOrigin: up ? 'bottom' : 'top',
                animation: `chart-grow .55s cubic-bezier(0.22,1,0.36,1) ${(i * 60).toFixed(0)}ms both`,
              }}
            />
          )
        })}

        {/* value on every cap (outside the bar) + category labels */}
        {rows.map((r, i) => {
          const hPx = Math.max(3, Math.abs(r.v) * scale)
          const up = r.v >= 0
          const labelY = up ? zeroY - hPx - 8 : zeroY + hPx + 14
          return (
            <g key={i}>
              <text x={x(i) + barW / 2} y={labelY} textAnchor="middle" fontSize="11" fontWeight="650" fill="var(--text-2,#6b6b78)">
                {(up ? '+' : '−') + usdShort(Math.abs(r.v))}
              </text>
              <text x={PAD.left + i * band + band / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-2,#6b6b78)">
                {r.label}
              </text>
              <rect
                x={PAD.left + i * band}
                y={PAD.top}
                width={band}
                height={ih}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          )
        })}
      </svg>

      <ChartTooltip
        width={width}
        tip={
          hover != null
            ? {
                x: x(hover) + barW / 2,
                y: rows[hover].v >= 0 ? zeroY - Math.abs(rows[hover].v) * scale : zeroY,
                label: rows[hover].label,
                value: (rows[hover].v >= 0 ? '+' : '−') + usd(Math.abs(rows[hover].v)),
                color: rows[hover].v >= 0 ? c.pos : c.neg,
              }
            : null
        }
      />

      <table className="sr-only">
        <caption>{t('dash.movements')}</caption>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th scope="row">{r.label}</th>
              <td>{(r.v >= 0 ? '+' : '−') + usd(Math.abs(r.v))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
