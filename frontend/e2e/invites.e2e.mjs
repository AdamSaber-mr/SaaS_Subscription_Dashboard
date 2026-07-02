// Team invitations: owner invites a colleague, copies the link, colleague
// accepts and lands inside the same team; members list shows both.
import { launch, newPage, waitText, bodyText, clickText, setField, sleep, check, BASE } from './helpers.mjs'

const stamp = Date.now()
const COMPANY = `Invite BV ${stamp}`

const browser = await launch()
try {
  const page = await newPage(browser)

  // owner registers a fresh tenant
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await page.waitForSelector('#login-email')
  await clickText(page, 'button', 'Nog geen account? Registreer je bedrijf')
  await page.waitForSelector('#login-name')
  await setField(page, '#login-name', 'Otto Owner')
  await setField(page, '#login-company', COMPANY)
  await setField(page, '#login-email', `invite${stamp}@testbedrijf.nl`)
  await setField(page, '#login-password', 'eigenaarwachtwoord1')
  await clickText(page, 'button', 'Account aanmaken')
  await waitText(page, 'Welkom, Otto!', 45000)

  // invite a colleague from the settings page
  await clickText(page, 'button', 'Instellingen')
  await waitText(page, 'Teamleden')
  await page.type('input[aria-label="E-mailadres van je collega"]', `collega${stamp}@testbedrijf.nl`)
  await clickText(page, 'button', 'Uitnodigen')
  await waitText(page, 'Uitnodiging verstuurd ✓')
  const inviteUrl = await page.$eval('input[aria-label="Invite link"]', (el) => el.value)
  check(inviteUrl.includes('/invite?token='), 'invite link available for copy-paste')
  await waitText(page, 'OPENSTAANDE UITNODIGINGEN')
  check(true, 'pending invitation listed')

  // colleague opens the link (logged out) and joins
  await page.click('button[aria-label="Uitloggen"]')
  await waitText(page, 'Inloggen')
  await page.goto(inviteUrl, { waitUntil: 'networkidle0' })
  await waitText(page, 'Uitnodiging voor ' + COMPANY)
  check(true, 'invite page shows the team name')
  await setField(page, '#invite-name', 'Carla Collega')
  await setField(page, '#invite-password', 'collegawachtwoord1')
  await clickText(page, 'button', 'Uitnodiging accepteren')
  await waitText(page, 'MRR-bewegingen', 45000)
  let t = await bodyText(page)
  check(t.includes(COMPANY), 'colleague lands inside the same team')
  check(t.includes('Carla Collega'), 'signed in as the new member')

  // members list shows both; the pending invite is gone
  await clickText(page, 'button', 'Instellingen')
  await waitText(page, 'Teamleden')
  await sleep(800)
  t = await bodyText(page)
  check(t.includes('Otto Owner') && t.includes('Carla Collega'), 'both members listed')
  check(!t.includes('OPENSTAANDE UITNODIGINGEN'), 'accepted invite no longer pending')

  // a used invite link cannot be replayed
  await page.click('button[aria-label="Uitloggen"]')
  await waitText(page, 'Inloggen')
  await page.goto(inviteUrl, { waitUntil: 'networkidle0' })
  await waitText(page, 'ongeldig, verlopen of al gebruikt')
  check(true, 'used invite link rejected')
} finally {
  await browser.close()
}
