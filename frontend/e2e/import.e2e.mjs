// CSV import: a fresh tenant uploads a file and the dashboard lights up;
// a broken file reports row errors and imports nothing.
import { writeFileSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { launch, newPage, waitText, bodyText, clickText, setField, sleep, check, BASE } from './helpers.mjs'

const stamp = Date.now()
const start = new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString().slice(0, 10) // ~4 months ago
const GOOD = join(tmpdir(), `import-goed-${stamp}.csv`)
const BAD = join(tmpdir(), `import-fout-${stamp}.csv`)
writeFileSync(GOOD, `name,email,plan,country,started_at\nImport Klant A,a@import.nl,growth,Netherlands,${start}\nImport Klant B,b@import.nl,scale,Belgium,${start}\n`)
writeFileSync(BAD, 'name,plan\nKapotte Rij,bestaat-niet\n')

const browser = await launch()
try {
  const page = await newPage(browser)

  // fresh tenant
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await page.waitForSelector('#login-email')
  await clickText(page, 'button', 'Nog geen account? Registreer je bedrijf')
  await page.waitForSelector('#login-name')
  await setField(page, '#login-name', 'Ines Import')
  await setField(page, '#login-company', `Import BV ${stamp}`)
  await setField(page, '#login-email', `import${stamp}@testbedrijf.nl`)
  await setField(page, '#login-password', 'importwachtwoord1')
  await clickText(page, 'button', 'Account aanmaken')
  await waitText(page, 'Welkom, Ines!', 20000)

  // open the import dialog on the customers page
  await clickText(page, 'button', 'Klanten')
  await waitText(page, 'klanten weergegeven')
  await clickText(page, 'button', 'CSV importeren')
  await waitText(page, 'Klanten importeren uit CSV')
  check(true, 'import dialog opens')

  // a broken file reports the row error and imports nothing
  let input = await page.$('#import-file')
  await input.uploadFile(BAD)
  await sleep(300)
  await clickText(page, 'button', 'Importeren')
  await waitText(page, 'onbekend plan')
  check((await bodyText(page)).includes('Rij 2'), 'row error with row number shown')

  // the good file imports both customers
  input = await page.$('#import-file')
  await input.uploadFile(GOOD)
  await sleep(300)
  await clickText(page, 'button', 'Importeren')
  await waitText(page, '2 klanten geïmporteerd ✓')
  check(true, 'import succeeds')
  await clickText(page, 'button', 'Annuleren') // close dialog
  await sleep(1200)
  const t = await bodyText(page)
  check(t.includes('Import Klant A') && t.includes('Import Klant B'), 'imported customers in the list')

  // dashboard shows the imported MRR history (growth 99 + scale 299)
  await clickText(page, 'button', 'Dashboard')
  await waitText(page, 'MRR-bewegingen')
  await sleep(1000)
  check((await bodyText(page)).includes('$398'), 'MRR reflects imported subscriptions')
} finally {
  await browser.close()
  rmSync(GOOD, { force: true })
  rmSync(BAD, { force: true })
}
