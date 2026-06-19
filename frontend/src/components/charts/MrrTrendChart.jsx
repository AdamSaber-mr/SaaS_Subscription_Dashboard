import Chart from 'react-apexcharts'
import { useDashboard } from '../../store/DashboardContext.jsx'
import { chartColors, FONT } from '../../lib/theme.js'
import { monthMeta, range, N } from '../../lib/engine.js'
import { usd } from '../../lib/format.js'

// Custom tooltip markup shared by the dashboard charts.
function tipHtml(label, val, color, c) {
  return (
    '<div style="padding:8px 11px;background:' + c.surface + ';border:1px solid ' + c.border +
    ';border-radius:9px;box-shadow:0 8px 22px rgba(8,8,12,0.16);font-family:' + FONT + ';">' +
    '<div style="font-size:10.5px;color:' + c.t3 + ';margin-bottom:3px;">' + label + '</div>' +
    '<div style="display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:' + c.t1 +
    ';font-variant-numeric:tabular-nums;"><span style="width:8px;height:8px;border-radius:50%;background:' +
    color + ';"></span>' + val + '</div></div>'
  )
}

export default function MrrTrendChart() {
  const { aggregates: A, theme, accent, period } = useDashboard()
  const c = chartColors(theme, accent)
  const [s, e] = range(period)
  const months = Array.from({ length: N }, (_, i) => monthMeta(i).short)
  const monthsLong = Array.from({ length: N }, (_, i) => monthMeta(i).long)
  const series = A.mrrEnd.map((v) => Math.round(v))

  const ann =
    s !== e
      ? [{ x: months[s], x2: months[e], fillColor: accent, opacity: 0.08, borderColor: 'transparent' }]
      : [{ x: months[e], borderColor: accent, strokeDashArray: 0, opacity: 0.5 }]

  const options = {
    chart: {
      type: 'area',
      height: 248,
      fontFamily: FONT,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, easing: 'easeinout', speed: 850, animateGradually: { enabled: true, delay: 120 }, dynamicAnimation: { enabled: true, speed: 520 } },
    },
    colors: [accent],
    stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.32, opacityTo: 0.02, stops: [0, 96] } },
    dataLabels: { enabled: false },
    markers: { size: 0, strokeWidth: 0, hover: { size: 5 } },
    grid: { borderColor: c.grid, strokeDashArray: 0, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { top: 4, right: 12, bottom: 0, left: 8 } },
    xaxis: {
      categories: months,
      tickAmount: 6,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: c.t3, fontSize: '10.5px' } },
      crosshairs: { show: true, stroke: { color: c.grid, width: 1, dashArray: 3 } },
      tooltip: { enabled: false },
    },
    yaxis: { tickAmount: 4, labels: { style: { colors: c.t3, fontSize: '10.5px' }, formatter: (v) => '$' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : Math.round(v)) } },
    tooltip: { custom: (o) => tipHtml(monthsLong[o.dataPointIndex], usd(series[o.dataPointIndex]), accent, c) },
    annotations: { xaxis: ann },
  }

  return (
    <div style={{ height: '248px', minHeight: '248px', margin: '0 -8px' }}>
      <Chart key={theme} type="area" height={248} options={options} series={[{ name: 'MRR', data: series }]} />
    </div>
  )
}

export { tipHtml }
