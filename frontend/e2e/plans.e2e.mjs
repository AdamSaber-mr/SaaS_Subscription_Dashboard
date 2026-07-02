// Plan management: create, edit, delete — on a fresh throwaway tenant so the
// demo data never changes.
import { launch, newPage, waitText, bodyText, clickText, setField, sleep, check, BASE } from './helpers.mjs'

const stamp = Date.now()

const browser = await launch()
try {
  const page = await newPage(browser, { width: 1440, height: 1000 })

  // fresh tenant
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await page.waitForSelector('#login-email')
  await clickText(page, 'button', 'Nog geen account? Registreer je bedrijf')
  await page.waitForSelector('#login-name')
  await setField(page, '#login-name', 'Piet Plannen')
  await setField(page, '#login-company', `Plannen BV ${stamp}`)
  await setField(page, '#login-email', `plans${stamp}@testbedrijf.nl`)
  await setField(page, '#login-password', 'plannenwachtwoord1')
  await clickText(page, 'button', 'Account aanmaken')
  await waitText(page, 'Welkom, Piet!', 20000)

  // plans page shows the four default tiers + management button
  await clickText(page, 'button', 'Plannen')
  await waitText(page, 'Omzetbijdrage per plan')
  check((await bodyText(page)).includes('Starter'), 'default tiers present')

  // create a new plan
  await clickText(page, 'button', 'Nieuw plan')
  await waitText(page, 'Plan aanmaken')
  await setField(page, '#plan-name', 'Premium Plus')
  await setField(page, '#plan-blurb', 'Voor de grootste klanten')
  await setField(page, '#plan-price', '499')
  await clickText(page, 'button', 'Plan aanmaken')
  await waitText(page, 'Premium Plus')
  check(true, 'new plan appears on the page')

  // it is available in the new-subscription picker
  await clickText(page, 'button', 'Nieuw abonnement')
  await waitText(page, 'Voeg een klant toe en start facturatie')
  check((await bodyText(page)).includes('Premium Plus'), 'new plan in subscription picker')
  await page.keyboard.press('Escape')
  await sleep(400)

  // edit: change the price
  await page.click(`button[aria-label="Bewerk plan Premium Plus"]`)
  await waitText(page, 'Plan bewerken')
  await setField(page, '#plan-price', '599')
  await clickText(page, 'button', 'Opslaan')
  await sleep(1200)
  check((await bodyText(page)).includes('$599'), 'edited price visible')

  // deleting a default tier that is unused should work; deleting one in use is blocked
  // first: use the enterprise tier for a subscription, then try to delete it
  await clickText(page, 'button', 'Nieuw abonnement')
  await waitText(page, 'Voeg een klant toe en start facturatie')
  await page.type('input[placeholder="Acme Inc."]', 'Enterprise Klant')
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Enterprise')).click())
  await clickText(page, 'button', 'Abonnement aanmaken')
  await sleep(1500)
  await clickText(page, 'button', 'Plannen')
  await waitText(page, 'Omzetbijdrage per plan')
  await page.click(`button[aria-label="Verwijder plan Enterprise"]`)
  await waitText(page, 'Plan verwijderen')
  await clickText(page, 'button', 'Verwijderen')
  await waitText(page, 'kan niet worden verwijderd')
  check(true, 'deleting a plan in use is blocked with a clear message')
  await page.keyboard.press('Escape')
  await sleep(400)

  // delete the unused Premium Plus plan
  await page.click(`button[aria-label="Verwijder plan Premium Plus"]`)
  await waitText(page, 'Plan verwijderen')
  await clickText(page, 'button', 'Verwijderen')
  await sleep(1200)
  check(!(await bodyText(page)).includes('Premium Plus'), 'unused plan deleted')
} finally {
  await browser.close()
}
