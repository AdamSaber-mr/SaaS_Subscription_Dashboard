// URL routing: deep links through the login gate, back/forward, refresh,
// unknown-path redirects.
import { launch, newPage, waitText, clickText, sleep, check, BASE } from './helpers.mjs'

const browser = await launch()
try {
  const page = await newPage(browser)
  const path = () => page.evaluate(() => location.pathname)

  // deep link while logged out → login gate → same URL after login
  await page.goto(BASE + '/customers', { waitUntil: 'networkidle0' })
  await waitText(page, 'Inloggen')
  check(true, 'deep link shows login gate')
  const { setField } = await import('./helpers.mjs')
  await setField(page, '#login-email', process.env.E2E_EMAIL || 'adamsaber.db@gmail.com')
  await setField(page, '#login-password', process.env.E2E_PASSWORD || 'password')
  await clickText(page, 'button', 'Inloggen')
  await waitText(page, 'weergegeven', 25000)
  check((await path()) === '/customers', 'URL preserved through login')

  // customer detail gets its own URL; refresh keeps it; back/forward work
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('div[style*="cursor: pointer"]')]
    rows.find((r) => r.textContent.includes('@')).click()
  })
  await waitText(page, 'Abonnementstijdlijn')
  const detailPath = await path()
  check(/^\/customers\/\d+$/.test(detailPath), 'detail has own URL: ' + detailPath)
  await page.reload({ waitUntil: 'networkidle0' })
  await waitText(page, 'Abonnementstijdlijn')
  check((await path()) === detailPath, 'refresh keeps detail URL')
  await page.goBack()
  await waitText(page, 'weergegeven')
  check((await path()) === '/customers', 'browser back works')
  await page.goForward()
  await waitText(page, 'Abonnementstijdlijn')
  check(true, 'browser forward works')

  // sidebar nav updates the URL; direct deep links work; bad paths redirect
  await clickText(page, 'button', 'Plannen')
  await waitText(page, 'Omzetbijdrage per plan')
  check((await path()) === '/plans', 'sidebar nav updates URL')
  await page.goto(BASE + '/insights', { waitUntil: 'networkidle0' })
  await waitText(page, 'netto nieuwe MRR')
  check(true, 'direct deep link /insights')
  await page.goto(BASE + '/bestaat-niet', { waitUntil: 'networkidle0' })
  await waitText(page, 'MRR-bewegingen')
  check((await path()) === '/dashboard', 'unknown path redirects to /dashboard')
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await sleep(500)
  check((await path()) === '/dashboard', 'root redirects to /dashboard')
} finally {
  await browser.close()
}
