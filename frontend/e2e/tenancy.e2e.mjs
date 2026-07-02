// Multi-tenancy: register → empty isolated workspace → first subscription →
// demo tenant unaffected. NOTE: creates a throwaway tenant; run against
// local/dev environments, not a database you care about.
import { launch, newPage, waitText, bodyText, clickText, setField, sleep, check, BASE, EMAIL, PASSWORD } from './helpers.mjs'

const stamp = Date.now()
const COMPANY = `E2E Testbedrijf ${stamp}`

const browser = await launch()
try {
  const page = await newPage(browser)

  // register a brand-new tenant
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await page.waitForSelector('#login-email')
  await clickText(page, 'button', 'Nog geen account? Registreer je bedrijf')
  await page.waitForSelector('#login-name')
  await setField(page, '#login-name', 'Eva Tester')
  await setField(page, '#login-company', COMPANY)
  await setField(page, '#login-email', `e2e${stamp}@testbedrijf.nl`)
  await setField(page, '#login-password', 'supergeheim123')
  await clickText(page, 'button', 'Account aanmaken')
  await waitText(page, 'Welkom, Eva!', 45000)
  check(true, 'registration lands on onboarding')

  let t = await bodyText(page)
  check(t.includes(COMPANY), 'sidebar shows own company')
  check(t.includes('$0'), 'fresh tenant starts at $0')
  check(!t.includes('Pine Metrics'), 'no demo data leaked in')

  // first subscription via the onboarding CTA
  await clickText(page, 'button', 'Nieuw abonnement')
  await waitText(page, 'Voeg een klant toe en start facturatie')
  await page.type('input[placeholder="Acme Inc."]', 'Eerste Klant BV')
  await clickText(page, 'button', 'Abonnement aanmaken')
  await sleep(1500)
  t = await bodyText(page)
  check(t.includes('Eerste Klant BV') && /\$99/.test(t), 'first subscription → $99 MRR')

  // demo tenant unaffected and cannot see the new tenant's customer
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle0' })
  await waitText(page, 'MRR-bewegingen')
  await page.click('button[aria-label="Uitloggen"]')
  await waitText(page, 'Inloggen')
  await setField(page, '#login-email', EMAIL)
  await setField(page, '#login-password', PASSWORD)
  await clickText(page, 'button', 'Inloggen')
  await waitText(page, 'MRR-bewegingen', 25000)
  await sleep(800)
  t = await bodyText(page)
  check(!t.includes(COMPANY), 'demo tenant does not see the other team')
  await page.goto(BASE + '/customers', { waitUntil: 'networkidle0' })
  await waitText(page, 'weergegeven')
  await page.type('input[placeholder="Zoek klanten…"]', 'Eerste Klant')
  await sleep(900)
  check(/0 van 0 klanten weergegeven/.test(await bodyText(page)), "other tenant's customers invisible")
} finally {
  await browser.close()
}
