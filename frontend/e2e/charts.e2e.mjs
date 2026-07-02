// Hand-built SVG charts: crosshair + hover tooltips, no chart-library remnants.
import { launch, newPage, login, bodyText, sleep, check } from './helpers.mjs'

const browser = await launch()
try {
  const page = await newPage(browser, { width: 1440, height: 1000 })
  await login(page)
  await sleep(1400)

  const info = await page.evaluate(() => ({
    svgs: document.querySelectorAll('svg[role="img"]').length,
    tables: document.querySelectorAll('table.sr-only').length,
    apex: document.querySelectorAll('.apexcharts-canvas').length,
  }))
  check(info.svgs >= 3, 'custom SVG charts render (' + info.svgs + ')')
  check(info.tables >= 3, 'table twins present')
  check(info.apex === 0, 'no ApexCharts remnants')

  const hoverChart = async (labelPart, xFrac, yFrac) => {
    const pos = await page.evaluate(
      ({ labelPart, xFrac, yFrac }) => {
        const svg = [...document.querySelectorAll('svg[role="img"]')].find((s) => (s.getAttribute('aria-label') || '').includes(labelPart))
        const r = svg.getBoundingClientRect()
        return { x: r.left + r.width * xFrac, y: r.top + r.height * yFrac }
      },
      { labelPart, xFrac, yFrac },
    )
    await page.mouse.move(pos.x, pos.y)
    await sleep(350)
  }

  await hoverChart('omzet', 0.55, 0.5)
  check(
    await page.evaluate(() => {
      const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december']
      return [...document.querySelectorAll('div')].some((d) => months.some((m) => d.textContent.trim().toLowerCase().startsWith(m)) && d.textContent.includes('$'))
    }),
    'trend crosshair tooltip (Dutch month + value)',
  )

  await hoverChart('klanten', 0.7, 0.6)
  check(
    await page.evaluate(() => [...document.querySelectorAll('div')].some((d) => /\d+ actieve klanten/.test(d.textContent))),
    'column hover tooltip',
  )

  await hoverChart('bewegingen', 0.2, 0.5)
  check(
    await page.evaluate(() => [...document.querySelectorAll('div')].some((d) => d.textContent.trim().startsWith('Nieuwe klanten') && d.textContent.includes('+$'))),
    'movements hover tooltip',
  )
} finally {
  await browser.close()
}
