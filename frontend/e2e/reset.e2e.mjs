// Forgot-password flow. Locally the mail lands in the Laravel log, so the
// suite fishes the reset link out of it and completes the whole journey.
// Against a remote E2E_BASE_URL only the request/confirmation UI is checked.
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { launch, newPage, waitText, clickText, setField, sleep, check, BASE } from './helpers.mjs'

const stamp = Date.now()
const EMAIL = `reset${stamp}@testbedrijf.nl`
const isLocal = BASE.includes('localhost') || BASE.includes('127.0.0.1')
const LOG = join(dirname(fileURLToPath(import.meta.url)), '../../backend/storage/logs/laravel.log')

/** The log mailer writes quoted-printable MIME: unfold and decode '='. */
function latestResetLink(email) {
  const raw = readFileSync(LOG, 'utf8').replace(/=\r?\n/g, '').replace(/=3D/g, '=')
  const re = new RegExp(`${BASE.replace(/[/.]/g, '\\$&')}/reset-password\\?token=([A-Za-z0-9]+)&email=${email.replace('@', '(?:%40|@)')}`, 'g')
  let match
  let last = null
  while ((match = re.exec(raw))) last = match[0]
  return last?.replace('%40', '@')
}

const browser = await launch()
try {
  const page = await newPage(browser)

  // a fresh account to reset (never touch shared credentials)
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await page.waitForSelector('#login-email')
  await clickText(page, 'button', 'Nog geen account? Registreer je bedrijf')
  await page.waitForSelector('#login-name')
  await setField(page, '#login-name', 'Rita Reset')
  await setField(page, '#login-company', `Reset BV ${stamp}`)
  await setField(page, '#login-email', EMAIL)
  await setField(page, '#login-password', 'eersteversie1')
  await clickText(page, 'button', 'Account aanmaken')
  await waitText(page, 'Welkom, Rita!', 45000)
  await page.click('button[aria-label="Uitloggen"]')
  await waitText(page, 'Inloggen')

  // request a reset link
  await clickText(page, 'button', 'Wachtwoord vergeten?')
  await waitText(page, 'resetlink')
  await setField(page, '#login-email', EMAIL)
  await clickText(page, 'button', 'Stuur resetlink')
  await waitText(page, 'zojuist een resetlink verstuurd')
  check(true, 'forgot form shows generic confirmation')

  if (!isLocal) {
    console.log('  (remote target: skipping the mail-log part)')
  } else {
    await sleep(800)
    const link = latestResetLink(EMAIL)
    check(!!link, 'reset link found in the mail log')

    // complete the reset
    await page.goto(link, { waitUntil: 'networkidle0' })
    await waitText(page, 'Nieuw wachtwoord instellen')
    await setField(page, '#reset-password', 'tweedeversie2')
    await setField(page, '#reset-confirm', 'tweedeversie2')
    await clickText(page, 'button', 'Wachtwoord opslaan')
    await waitText(page, 'je kunt nu inloggen')
    check(true, 'password reset via emailed link')

    // old password rejected, new one signs in
    await clickText(page, 'button', 'Terug naar inloggen')
    await page.waitForSelector('#login-email')
    await setField(page, '#login-email', EMAIL)
    await setField(page, '#login-password', 'eersteversie1')
    await clickText(page, 'button', 'Inloggen')
    await waitText(page, 'credentials are incorrect')
    check(true, 'old password rejected')
    await setField(page, '#login-password', 'tweedeversie2')
    await clickText(page, 'button', 'Inloggen')
    await waitText(page, 'MRR-bewegingen', 25000)
    check(true, 'new password signs in')

    // a used token cannot be replayed
    await page.click('button[aria-label="Uitloggen"]')
    await waitText(page, 'Inloggen')
    await page.goto(link, { waitUntil: 'networkidle0' })
    await waitText(page, 'Nieuw wachtwoord instellen')
    await setField(page, '#reset-password', 'derdeversie3')
    await setField(page, '#reset-confirm', 'derdeversie3')
    await clickText(page, 'button', 'Wachtwoord opslaan')
    await waitText(page, 'ongeldig of verlopen')
    check(true, 'used token is rejected')
  }
} finally {
  await browser.close()
}
