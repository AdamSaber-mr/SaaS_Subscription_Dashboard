import Chart from 'react-apexcharts'
import { useDashboard } from '../../store/DashboardContext.jsx'
import { chartColors, FONT } from '../../lib/theme.js'
import { hexA } from '../../lib/format.js'
import { tipHtml } from './MrrTrendChart.jsx'

export default function ActiveCustomersChart() {
  const { metrics, theme, accent } = useDashboard()
  const [s, e] = metrics.range
  const months = metrics.trend.months
  const monthsLong = metrics.trend.monthsLong
  const series = metrics.trend.activeCustomers
  const c = chartColors(theme, accent)
  const accentFade = hexA(accent, c.isLight ? 0.3 : 0.4)
  const cols = series.map((_, i) => (i >= s && i <= e ? accent : accentFade))

  const options = {
    chart: {
      type: 'bar',
      height: 212,
      fontFamily: FONT,
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 700, animateGradually: { enabled: true, delay: 25 }, dynamicAnimation: { enabled: true, speed: 450 } },
    },
    plotOptions: { bar: { columnWidth: '58%', borderRadius: 4, borderRadiusApplication: 'end', distributed: true } },
    colors: cols,
    fill: { type: 'gradient', gradient: { shadeIntensity: 0.3, opacityFrom: 0.95, opacityTo: 0.82, stops: [0, 100] } },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: { borderColor: c.grid, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } }, padding: { top: 0, right: 8, bottom: 0, left: 8 } },
    xaxis: {
      categories: months,
      tickAmount: 6,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: c.t3, fontSize: '10.5px' } },
      crosshairs: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: { tickAmount: 3, labels: { style: { colors: c.t3, fontSize: '10.5px' }, formatter: (v) => Math.round(v) } },
    tooltip: { custom: (o) => tipHtml(monthsLong[o.dataPointIndex], series[o.dataPointIndex] + ' active customers', accent, c) },
  }

  return (
    <div style={{ height: '212px', minHeight: '212px', margin: '0 -8px' }}>
      <Chart key={theme} type="bar" height={212} options={options} series={[{ name: 'Customers', data: series }]} />
    </div>
  )
}
