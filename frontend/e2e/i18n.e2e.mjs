// i18n: Dutch by default, EN/NL toggle switches everything and persists.
import { launch, newPage, login, waitText, bodyText, clickText, sleep, check, BASE } from './helpers.mjs'

const browser = await launch()
try {
  const page = await newPage(browser)

  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await waitText(page, 'Inloggen')
  let t = await bodyText(page)
  check(t.includes('E-mail') && t.includes('Wachtwoord'), 'login is Dutch by default')

  await login(page)
  t = await bodyText(page)
  for (const s of ['Overzicht', 'Inzichten', 'Klanten', 'Plannen', 'Abonnementen', 'Deze maand', 'Donkere modus']) {
    check(t.includes(s), 'Dutch: ' + s)
  }

  await clickText(page, 'button', 'EN')
  await sleep(900)
  t = await bodyText(page)
  for (const s of ['Overview', 'Insights', 'Customers', 'Plans', 'Subscriptions', 'MRR movements', 'This month', 'Dark mode']) {
    check(t.includes(s), 'English: ' + s)
  }

  await page.reload({ waitUntil: 'networkidle0' })
  await waitText(page, 'MRR movements', 20000)
  check(true, 'language persists across refresh')

  await clickText(page, 'button', 'NL')
  await sleep(600)
  await waitText(page, 'MRR-bewegingen')
  await page.goto(BASE + '/plans', { waitUntil: 'networkidle0' })
  await waitText(page, 'Omzetbijdrage per plan')
  t = await bodyText(page)
  check(t.includes('Aandeel in omzet'), 'plans page Dutch')
  await page.goto(BASE + '/customers', { waitUntil: 'networkidle0' })
  await waitText(page, 'klanten weergegeven')
  t = (await bodyText(page)).toLowerCase() // column headers render uppercase via CSS
  check(t.includes('aangemeld') && t.includes('land'), 'customers table Dutch')
} finally {
  await browser.close()
}
