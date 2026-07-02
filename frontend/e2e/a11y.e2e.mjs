// Accessibility: dialog semantics + focus trap + Escape, keyboard row
// navigation, focus-visible tooltips.
import { launch, newPage, login, waitText, clickText, sleep, check } from './helpers.mjs'

const browser = await launch()
try {
  const page = await newPage(browser)
  await login(page)

  // modal: dialog role, labelled, focus moves in and stays trapped
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Nieuw abonnement')).click())
  await waitText(page, 'Voeg een klant toe en start facturatie')
  const dialog = await page.evaluate(() => {
    const d = document.querySelector('[role="dialog"]')
    return {
      exists: !!d,
      ariaModal: d?.getAttribute('aria-modal'),
      labelled: !!document.getElementById(d?.getAttribute('aria-labelledby')),
      focusInside: d?.contains(document.activeElement),
    }
  })
  check(dialog.exists && dialog.ariaModal === 'true' && dialog.labelled, 'dialog semantics')
  check(dialog.focusInside, 'focus moves into dialog')
  for (let i = 0; i < 15; i++) await page.keyboard.press('Tab')
  check(await page.evaluate(() => document.querySelector('[role="dialog"]')?.contains(document.activeElement)), 'focus trap holds 15 tabs')
  await page.keyboard.press('Escape')
  await sleep(400)
  check(!(await page.$('[role="dialog"]')), 'Escape closes modal')

  // keyboard navigation on customer rows
  await clickText(page, 'button', 'Klanten')
  await waitText(page, 'weergegeven')
  await page.evaluate(() => document.querySelector('[role="link"][tabindex="0"]').focus())
  await page.keyboard.press('Enter')
  await waitText(page, 'Abonnementstijdlijn')
  check(/\/customers\/\d+$/.test(await page.evaluate(() => location.pathname)), 'Enter on row opens detail')

  // InfoTip on keyboard focus
  await clickText(page, 'button', 'Dashboard')
  await waitText(page, 'MRR-bewegingen')
  await page.evaluate(() => document.querySelector('span[role="img"][tabindex="0"]').focus())
  await sleep(300)
  check(!!(await page.$('[role="tooltip"]')), 'InfoTip shows on focus')

  // charts ship sr-only table twins
  const twins = await page.evaluate(() => document.querySelectorAll('table.sr-only').length)
  check(twins >= 3, 'chart table twins present (' + twins + ')')
} finally {
  await browser.close()
}
