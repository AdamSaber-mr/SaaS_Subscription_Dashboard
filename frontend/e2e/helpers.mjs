// Shared plumbing for the Puppeteer e2e suites.
//
// Defaults target the local dev stack (vite on :5173, artisan on :8000,
// the seeded demo account). Point at another environment via env vars:
//   E2E_BASE_URL=https://revenue-os-app.vercel.app \
//   E2E_EMAIL=... E2E_PASSWORD=... npm run e2e
import puppeteer from 'puppeteer-core'

export const BASE = (process.env.E2E_BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
export const EMAIL = process.env.E2E_EMAIL || 'adamsaber.db@gmail.com'
export const PASSWORD = process.env.E2E_PASSWORD || 'password'

const CHROME =
  process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function launch(options = {}) {
  return puppeteer.launch({ executablePath: CHROME, headless: 'new', ...options })
}

export async function newPage(browser, { width = 1440, height = 900 } = {}) {
  const page = await browser.newPage()
  await page.setViewport({ width, height })
  return page
}

export function waitText(page, text, timeout = 15000) {
  return page.waitForFunction((t) => document.body.innerText.includes(t), { timeout }, text)
}

export function bodyText(page) {
  return page.evaluate(() => document.body.innerText)
}

/** Click the first <tag> whose trimmed text equals `text`. Throws if absent. */
export async function clickText(page, tag, text) {
  const ok = await page.evaluate(
    ({ tag, text }) => {
      const el = [...document.querySelectorAll(tag)].find((e) => e.textContent.trim() === text)
      if (el) {
        el.click()
        return true
      }
      return false
    },
    { tag, text },
  )
  if (!ok) throw new Error(`clickText: <${tag}> "${text}" not found`)
}

/** Set an input's value through React's native setter (fires onChange). */
export function setField(page, selector, value) {
  return page.evaluate(
    ({ selector, value }) => {
      const el = document.querySelector(selector)
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
      setter.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    },
    { selector, value },
  )
}

/** Log in via the UI and wait for the dashboard. */
export async function login(page, { email = EMAIL, password = PASSWORD } = {}) {
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
  await page.waitForSelector('#login-email', { timeout: 15000 })
  await setField(page, '#login-email', email)
  await setField(page, '#login-password', password)
  await clickText(page, 'button', 'Inloggen')
  await waitText(page, 'MRR-bewegingen', 25000)
}

export function check(condition, label) {
  if (!condition) throw new Error('FAILED: ' + label)
  console.log('  ✓ ' + label)
}
