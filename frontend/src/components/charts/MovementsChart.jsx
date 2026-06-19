import Chart from 'react-apexcharts'
import { useDashboard } from '../../store/DashboardContext.jsx'
import { chartColors, FONT } from '../../lib/theme.js'
import { usd } from '../../lib/format.js'
import { tipHtml } from './MrrTrendChart.jsx'

// Diverging bar chart: green = revenue added, red = revenue removed.
export default function MovementsChart({ m }) {
  const { theme, accent } = useDashboard()
  const c = chartColors(theme, accent)
  const cats = ['New customers', 'Upgrades', 'Downgrades', 'Cancellations']
  const data = [m.newM, m.expM, -m.conM, -m.chuM]

  const options = {
    chart: { type: 'bar', height: 240, fontFamily: FONT, toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout', speed: 800, dynamicAnimation: { enabled: true, speed: 520 } } },
    plotOptions: {
      bar: {
        columnWidth: '52%',
        borderRadius: 5,
        borderRadiusApplication: 'end',
        colors: {
          ranges: [
            { from: -1000000000000, to: -0.01, color: c.neg },
            { from: 0.01, to: 1000000000000, color: c.pos },
          ],
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { borderColor: c.grid, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { top: 6, right: 8, bottom: 0, left: 8 } },
    xaxis: {
      categories: cats,
      position: 'bottom',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: c.t2, fontSize: '11px' } },
      crosshairs: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: { labels: { style: { colors: c.t3, fontSize: '10.5px' }, formatter: (v) => '$' + (Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'k' : Math.round(v)) } },
    tooltip: {
      custom: (o) => {
        const v = data[o.dataPointIndex]
        return tipHtml(cats[o.dataPointIndex], (v >= 0 ? '+' : '−') + usd(Math.abs(v)), v >= 0 ? c.pos : c.neg, c)
      },
    },
  }

  return (
    <div style={{ height: '240px', minHeight: '240px', margin: '0 -8px' }}>
      <Chart key={theme} type="bar" height={240} options={options} series={[{ name: 'MRR change', data }]} />
    </div>
  )
}
