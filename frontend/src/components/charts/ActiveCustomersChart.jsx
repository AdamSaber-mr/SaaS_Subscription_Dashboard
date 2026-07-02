import { useMemo, useState } from 'react'
import { useDashboard } from '../../store/DashboardContext.jsx'
import { hexA } from '../../lib/format.js'
import { trMonths } from '../../lib/i18n.js'
import { useSize, niceScale, roundedTopRect, ChartTooltip } from './ChartBits.jsx'

const H = 212
const PAD = { top: 18, right: 8, bottom: 26, left: 34 }

// Hand-built SVG column chart: thin flat columns (≤22px) rounded only at the
// data end, growing from the baseline with a small stagger. Months outside the
// selected period keep the same hue at reduced strength (emphasis, never a
// repaint). Each column is its own hover target — the whole band, not just
// the painted pixels.
export default function ActiveCustomersChart() {
  const { metrics, accent, lang, t } = useDashboard()
  const [wrapRef, width] = useSize()
  const [hover, setHover] = useState(null)

  const [s, e] = metrics.range
  const series = metrics.trend.activeCustomers
  const months = metrics.trend.months.map((m) => trMonths(m, lang))
  const monthsLong = metrics.trend.monthsLong.map((m) => trMonths(m, lang))
  const n = series.length
  const last = n - 1

  const iw = Math.max(0, width - PAD.left - PAD.right)
  const ih = H - PAD.top - PAD.bottom
  const { max, ticks } = useMemo(() => niceScale(Math.max(...series), 3), [series])
  const band = iw / n
  const barW = Math.min(22, band * 0.55)
  const x = (i) => PAD.left + i * band + (band - barW) / 2
  const y = (v) => PAD.top + ih - (v / max) * ih

  const xLabelStep = Math.ceil(n / 6)
  const faded = hexA(accent, 0.28)

  if (!width) return <div ref={wrapRef} style={{ height: H + 'px' }} />

  return (
    <div ref={wrapRef} style={{ position: 'relative', height: H + 'px' }}>
      <svg width={width} height={H} role="img" aria-label={t('dash.activeTitle') + ' — ' + series[last]} style={{ display: 'block' }}>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={PAD.left} x2={PAD.left + iw} y1={y(tk)} y2={y(tk)} stroke="var(--border,#ececef)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y(tk) + 3.5} textAnchor="end" fontSize="10.5" fill="var(--text-3,#9a9aa6)">
              {tk}
            </text>
          </g>
        ))}

        {months.map((m, i) =>
          i % xLabelStep === 0 ? (
            <text key={i} x={x(i) + barW / 2} y={H - 8} textAnchor="middle" fontSize="10.5" fill="var(--text-3,#9a9aa6)">
              {m}
            </text>
          ) : null,
        )}

        {series.map((v, i) => {
          const inPeriod = i >= s && i <= e
          const isHover = hover === i
          return (
            <g key={i}>
              <path
                d={roundedTopRect(x(i), y(v), barW, PAD.top + ih - y(v), 3)}
                fill={inPeriod ? accent : faded}
                opacity={isHover ? 0.82 : 1}
                style={{
                  transformBox: 'fill-box',
                  transformOrigin: 'bottom',
                  animation: `chart-grow .55s cubic-bezier(0.22,1,0.36,1) ${(i * 22).toFixed(0)}ms both`,
                }}
              />
              {/* hit target: the full band, top to baseline */}
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

        {/* selective direct label: only the latest month */}
        <text x={x(last) + barW / 2} y={y(series[last]) - 7} textAnchor="middle" fontSize="11" fontWeight="650" fill="var(--text,#15151b)">
          {series[last]}
        </text>
      </svg>

      <ChartTooltip
        width={width}
        tip={hover != null ? { x: x(hover) + barW / 2, y: y(series[hover]), label: monthsLong[hover], value: series[hover] + ' ' + t('dash.activeTooltip'), color: accent } : null}
      />

      <table className="sr-only">
        <caption>{t('dash.activeTitle')}</caption>
        <tbody>
          {series.map((v, i) => (
            <tr key={i}>
              <th scope="row">{monthsLong[i]}</th>
              <td>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
