// Settings: profile, company and password changes — self-contained on a
// freshly registered throwaway tenant so shared credentials never change.
import { launch, newPage, waitText, bodyText, clickText, setField, sleep, check, BASE } from './helpers.mjs'

const stamp = Date.now()
const EMAIL = `settings${stamp}@testbedrijf.nl`

const browser = await launch()
try {
  const page = await newPage(browser)

  // fresh tenant
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await page.waitForSelector('#login-email')
  await clickText(page, 'button', 'Nog geen account? Registreer je bedrijf')
  await page.waitForSelector('#login-name')
  await setField(page, '#login-name', 'Sam Settings')
  await setField(page, '#login-company', `Settings BV ${stamp}`)
  await setField(page, '#login-email', EMAIL)
  await setField(page, '#login-password', 'eerstewachtwoord1')
  await clickText(page, 'button', 'Account aanmaken')
  await waitText(page, 'Welkom, Sam!', 45000)

  // settings page via the sidebar
  await clickText(page, 'button', 'Instellingen')
  await waitText(page, 'Huidig wachtwoord')
  check(true, 'settings page renders')

  // profile: rename → sidebar updates
  await setField(page, '#set-name', 'Samantha Settings')
  await page.evaluate(() => document.querySelector('#set-name').closest('form').querySelector('button[type="submit"]').click())
  await waitText(page, 'Opgeslagen ✓')
  check((await bodyText(page)).includes('Samantha Settings'), 'profile name saved + sidebar updated')

  // company rename → sidebar branding updates
  await setField(page, '#set-company', 'Omgedoopt BV')
  await page.evaluate(() => document.querySelector('#set-company').closest('form').querySelector('button[type="submit"]').click())
  await sleep(1000)
  check((await bodyText(page)).includes('Omgedoopt BV'), 'company rename reflected in sidebar')

  // password: wrong current password shows an error
  await setField(page, '#set-current', 'fout-wachtwoord')
  await setField(page, '#set-new', 'tweedewachtwoord2')
  await setField(page, '#set-confirm', 'tweedewachtwoord2')
  await page.evaluate(() => document.querySelector('#set-current').closest('form').querySelector('button[type="submit"]').click())
  await sleep(1200)
  check(!(await bodyText(page)).includes('Wachtwoord gewijzigd'), 'wrong current password rejected')

  // correct password change
  await setField(page, '#set-current', 'eerstewachtwoord1')
  await setField(page, '#set-new', 'tweedewachtwoord2')
  await setField(page, '#set-confirm', 'tweedewachtwoord2')
  await page.evaluate(() => document.querySelector('#set-current').closest('form').querySelector('button[type="submit"]').click())
  await waitText(page, 'Wachtwoord gewijzigd ✓')
  check(true, 'password changed')

  // old password fails, new password logs in
  await page.click('button[aria-label="Uitloggen"]')
  await waitText(page, 'Inloggen')
  await setField(page, '#login-email', EMAIL)
  await setField(page, '#login-password', 'eerstewachtwoord1')
  await clickText(page, 'button', 'Inloggen')
  await waitText(page, 'credentials are incorrect')
  check(true, 'old password rejected')
  await setField(page, '#login-password', 'tweedewachtwoord2')
  await clickText(page, 'button', 'Inloggen')
  // the login gate preserves the URL, so we land back on /settings
  await waitText(page, 'Huidig wachtwoord', 25000)
  check(true, 'new password logs in (back on /settings)')
} finally {
  await browser.close()
}
