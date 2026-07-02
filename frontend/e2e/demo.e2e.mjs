// Demo mode: one click from the login screen into a read-only tour of the
// sample tenant, with a standing CTA to register — and no way to change data.
import { launch, newPage, waitText, bodyText, clickText, sleep, check, BASE } from './helpers.mjs'

const browser = await launch()
try {
  const page = await newPage(browser)

  // demo button on the login screen
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await page.waitForSelector('#login-email')
  await clickText(page, 'button', 'Bekijk eerst de demo met voorbeelddata')
  await waitText(page, 'MRR-bewegingen', 25000)
  let t = await bodyText(page)
  check(/\$[\d,]+/.test(t), 'demo dashboard shows real sample data')
  check(t.includes('Je bekijkt de demo met voorbeelddata'), 'demo banner visible')
  check(t.includes('Maak gratis je eigen account'), 'register CTA in banner')

  // browsing works everywhere
  await clickText(page, 'button', 'Klanten')
  await waitText(page, 'klanten weergegeven')
  check(true, 'customers browsable in demo')

  // writes are blocked with a friendly nudge
  await clickText(page, 'button', 'Nieuw abonnement')
  await waitText(page, 'Voeg een klant toe en start facturatie')
  await page.type('input[placeholder="Acme Inc."]', 'Mag Niet BV')
  await clickText(page, 'button', 'Abonnement aanmaken')
  await waitText(page, 'In de demo kun je niets wijzigen')
  check(true, 'mutation blocked with register nudge')

  // the sample data is untouched
  t = await bodyText(page)
  check(!t.includes('Mag Niet BV'), 'nothing was created')

  // banner CTA → logout → register form open
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Maak gratis je eigen account')).click())
  await waitText(page, 'Account aanmaken', 15000)
  check(!!(await page.$('#login-company')), 'CTA lands on the register form')
} finally {
  await browser.close()
}
