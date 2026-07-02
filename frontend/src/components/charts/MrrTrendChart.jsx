import { useMemo, useState } from 'react'
import { useDashboard } from '../../store/DashboardContext.jsx'
import { usd, usdShort } from '../../lib/format.js'
import { trMonths } from '../../lib/i18n.js'
import { useSize, niceScale, smoothPath, ChartTooltip } from './ChartBits.jsx'

const H = 248
const PAD = { top: 16, right: 52, bottom: 26, left: 44 }

// Hand-built SVG area chart: 2px smooth line over a quiet gradient wash,
// hairline grid, shaded selected period, endpoint dot + direct label, and a
// snapping crosshair with a tooltip (the crosshair finds the X — readers aim
// at a month, never at the 2px line).
export default function MrrTrendChart() {
  const { metrics, accent, lang, t } = useDashboard()
  const [wrapRef, width] = useSize()
  const [hover, setHover] = useState(null) // snapped index

  const [s, e] = metrics.range
  const series = metrics.trend.mrr
  const months = metrics.trend.months.map((m) => trMonths(m, lang))
  const monthsLong = metrics.trend.monthsLong.map((m) => trMonths(m, lang))
  const n = series.length
  const last = n - 1

  const iw = Math.max(0, width - PAD.left - PAD.right)
  const ih = H - PAD.top - PAD.bottom
  const { max, ticks } = useMemo(() => niceScale(Math.max(...series)), [series])
  const x = (i) => PAD.left + (n > 1 ? (i / (n - 1)) * iw : 0)
  const y = (v) => PAD.top + ih - (v / max) * ih

  const pts = series.map((v, i) => [x(i), y(v)])
  const line = smoothPath(pts)
  const area = line + ` L${x(last).toFixed(1)},${(PAD.top + ih).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + ih).toFixed(1)} Z`

  const xLabelStep = Math.ceil(n / 6)
  const halfBand = n > 1 ? iw / (n - 1) / 2 : 0

  const onMove = (ev) => {
    const rect = ev.currentTarget.getBoundingClientRect()
    const px = ev.clientX - rect.left
    const i = Math.round(((px - PAD.left) / Math.max(1, iw)) * (n - 1))
    setHover(Math.max(0, Math.min(last, i)))
  }

  if (!width) return <div ref={wrapRef} style={{ height: H + 'px' }} />

  return (
    <div ref={wrapRef} style={{ position: 'relative', height: H + 'px' }}>
      <svg width={width} height={H} role="img" aria-label={t('dash.trendTitle') + ' — ' + usd(series[last])} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="mrr-wash" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.16" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* selected period, whisper quiet */}
        <rect x={x(s) - (s > 0 ? halfBand : 0)} y={PAD.top} width={x(e) - x(s) + halfBand * (s > 0 ? 2 : 1)} height={ih} fill={accent} opacity="0.05" />

        {/* hairline grid + $ ticks */}
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={PAD.left} x2={PAD.left + iw} y1={y(tk)} y2={y(tk)} stroke="var(--border,#ececef)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(tk) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--text-3,#9a9aa6)">
              {'$' + (tk >= 1000 ? tk / 1000 + 'k' : tk)}
            </text>
          </g>
        ))}

        {/* month labels */}
        {months.map((m, i) =>
          i % xLabelStep === 0 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--text-3,#9a9aa6)">
              {m}
            </text>
          ) : null,
        )}

        {/* wash + line, drawn in on mount */}
        <path d={area} fill="url(#mrr-wash)" style={{ animation: 'chart-fade .9s ease both' }} />
        <path d={line} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength="1" style={{ strokeDasharray: 1, animation: 'chart-draw 1s cubic-bezier(0.4,0,0.2,1) both' }} />

        {/* crosshair + snapped point */}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + ih} stroke="var(--border-strong,#e0e0e6)" strokeWidth="1" />
            <circle cx={x(hover)} cy={y(series[hover])} r="5" fill={accent} stroke="var(--surface,#fff)" strokeWidth="2" />
          </g>
        )}

        {/* endpoint dot + direct label */}
        <circle cx={x(last)} cy={y(series[last])} r="4.5" fill={accent} stroke="var(--surface,#fff)" strokeWidth="2" />
        <text x={x(last) + 9} y={y(series[last]) + 4} fontSize="11.5" fontWeight="650" fill="var(--text,#15151b)">
          {usdShort(series[last])}
        </text>

        {/* hit layer: the whole plot, so the crosshair does the aiming */}
        <rect x={PAD.left} y={PAD.top} width={iw} height={ih} fill="transparent" onMouseMove={onMove} onMouseLeave={() => setHover(null)} />
      </svg>

      <ChartTooltip width={width} tip={hover != null ? { x: x(hover), y: y(series[hover]), label: monthsLong[hover], value: usd(series[hover]), color: accent } : null} />

      {/* WCAG twin: the same values as a plain table */}
      <table className="sr-only">
        <caption>{t('dash.trendTitle')}</caption>
        <tbody>
          {series.map((v, i) => (
            <tr key={i}>
              <th scope="row">{monthsLong[i]}</th>
              <td>{usd(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
