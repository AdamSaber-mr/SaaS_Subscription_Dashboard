// Mobile (390px): no horizontal page overflow, drawer sidebar opens/closes,
// tables scroll inside their own cards.
import { launch, newPage, waitText, clickText, setField, sleep, check, BASE, EMAIL, PASSWORD } from './helpers.mjs'

const browser = await launch()
try {
  const page = await newPage(browser, { width: 390, height: 844 })

  const noOverflow = async (label) => {
    const m = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, win: window.innerWidth }))
    check(m.doc <= m.win + 1, `${label}: no horizontal overflow (${m.doc}px on ${m.win}px)`)
  }

  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await page.waitForSelector('#login-email')
  await noOverflow('login')
  await setField(page, '#login-email', EMAIL)
  await setField(page, '#login-password', PASSWORD)
  await clickText(page, 'button', 'Inloggen')
  await waitText(page, 'MRR-bewegingen', 25000)
  await sleep(1200)
  await noOverflow('dashboard')

  // drawer: hamburger opens the sidebar, navigating closes it
  check(!!(await page.$('button[aria-label="Menu"]')), 'hamburger button present')
  await page.click('button[aria-label="Menu"]')
  await sleep(400)
  check(await page.evaluate(() => document.body.innerText.includes('Klanten')), 'drawer shows navigation')
  await clickText(page, 'button', 'Klanten')
  await waitText(page, 'weergegeven')
  await sleep(400)
  check(!(await page.evaluate(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === 'Plannen' && b.getBoundingClientRect().width > 0))), 'drawer closes after navigating')
  await noOverflow('customers')

  await page.goto(BASE + '/subscriptions', { waitUntil: 'networkidle0' })
  await waitText(page, 'Actieve abonnementen')
  await noOverflow('subscriptions')

  await page.goto(BASE + '/plans', { waitUntil: 'networkidle0' })
  await waitText(page, 'Omzetbijdrage per plan')
  await noOverflow('plans')

  await page.goto(BASE + '/insights', { waitUntil: 'networkidle0' })
  await waitText(page, 'netto nieuwe MRR')
  await noOverflow('insights')
} finally {
  await browser.close()
}
