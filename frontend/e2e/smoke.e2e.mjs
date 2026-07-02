// Full regression: login (incl. error path) → every page → subscription
// lifecycle with live metric updates → theme + session persistence → logout.
import { launch, newPage, waitText, bodyText, clickText, setField, sleep, check, BASE } from './helpers.mjs'

const browser = await launch()
try {
  const page = await newPage(browser)
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  // login screen, centered card
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await waitText(page, 'Inloggen')
  const box = await page.$eval('form', (f) => f.getBoundingClientRect().toJSON())
  check(Math.abs(box.x + box.width / 2 - 720) < 60, 'login card centered')

  // wrong password → visible error
  await setField(page, '#login-email', process.env.E2E_EMAIL || 'adamsaber.db@gmail.com')
  await setField(page, '#login-password', 'wrong-password')
  await clickText(page, 'button', 'Inloggen')
  await waitText(page, 'credentials are incorrect')
  check(true, 'wrong password shows error')

  // correct login
  await setField(page, '#login-password', process.env.E2E_PASSWORD || 'password')
  await clickText(page, 'button', 'Inloggen')
  await waitText(page, 'MRR-bewegingen', 25000)
  await sleep(1200)
  let t = await bodyText(page)
  for (const label of ['MRR', 'ARR', 'Actieve klanten', 'Netto nieuwe MRR', 'Cohortretentie', 'Netto-omzetretentie']) {
    check(t.includes(label), 'dashboard shows: ' + label)
  }
  check(/\$\d/.test(t), 'dashboard shows dollar values')

  // period switch + insights
  await clickText(page, 'button', 'Deze maand')
  await sleep(700)
  await clickText(page, 'button', 'Inzichten')
  await waitText(page, 'netto nieuwe MRR')
  check(true, 'insights renders')

  // customers: pager, search, detail
  await clickText(page, 'button', 'Klanten')
  await waitText(page, 'weergegeven')
  t = await bodyText(page)
  check(t.includes('Pagina 1 van'), 'customers pager present')
  await page.type('input[placeholder="Zoek klanten…"]', 'labs')
  await sleep(900)
  check(/\d+ van \d+ klanten weergegeven/.test(await bodyText(page)), 'search updates the list')
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('div[style*="cursor: pointer"]')]
    rows.find((r) => r.textContent.includes('@')).click()
  })
  await waitText(page, 'Abonnementstijdlijn')
  await waitText(page, 'Betaalhistorie')
  check(true, 'customer detail shows timeline + invoices')

  // plans
  await clickText(page, 'button', 'Plannen')
  await waitText(page, 'Omzetbijdrage per plan')
  check(true, 'plans renders')

  // subscriptions lifecycle: create → count +1 → cancel → count restored
  await clickText(page, 'button', 'Abonnementen')
  await waitText(page, 'Actieve abonnementen')
  const activeCount = () =>
    page.evaluate(() => Number((document.body.innerText.match(/Actieve abonnementen\n(\d+)/) || [])[1]))
  const before = await activeCount()
  await clickText(page, 'button', 'Nieuw abonnement')
  await waitText(page, 'Voeg een klant toe en start facturatie')
  await page.type('input[placeholder="Acme Inc."]', 'E2E Test BV')
  await clickText(page, 'button', 'Abonnement aanmaken')
  await sleep(1500)
  check((await bodyText(page)).includes('E2E Test BV'), 'new subscription visible')
  check((await activeCount()) === before + 1, 'active count went up')
  await page.evaluate(() => {
    const rows = [...document.querySelectorAll('div')].filter((d) => d.textContent.includes('E2E Test BV'))
    const row = rows[rows.length - 1].closest('div[style*="grid-template-columns"]') || rows[rows.length - 1]
    ;[...row.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Opzeggen').click()
  })
  await waitText(page, 'Abonnement opzeggen')
  await clickText(page, 'button', 'Opzegging bevestigen')
  await sleep(1500)
  check((await activeCount()) === before, 'cancel restored the count')

  // theme, session persistence, logout
  await clickText(page, 'button', 'Donkere modus')
  await sleep(600)
  await page.reload({ waitUntil: 'networkidle0' })
  await waitText(page, 'MRR', 20000)
  check(!(await bodyText(page)).includes('Inloggen\n'), 'session persists across refresh')
  await page.click('button[aria-label="Uitloggen"]')
  await waitText(page, 'Inloggen')
  check(true, 'logout returns to login')

  const realErrors = consoleErrors.filter((e) => !e.includes('422') && !e.includes('Failed to load resource'))
  check(realErrors.length === 0, 'no console errors (' + realErrors.join('; ').slice(0, 100) + ')')
} finally {
  await browser.close()
}
