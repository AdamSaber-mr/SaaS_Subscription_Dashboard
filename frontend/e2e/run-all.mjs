// Runs every *.e2e.mjs suite in this directory sequentially and summarizes.
// Requires the app to be running (local: vite + artisan serve, or set
// E2E_BASE_URL). See helpers.mjs for configuration.
import { readdirSync } from 'fs'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const dir = dirname(fileURLToPath(import.meta.url))
const suites = readdirSync(dir).filter((f) => f.endsWith('.e2e.mjs')).sort()

let failed = 0
for (const suite of suites) {
  console.log(`\n━━━ ${suite} ━━━`)
  // small gap between suites so consecutive logins stay under the API throttle
  await new Promise((r) => setTimeout(r, 3000))
  const res = spawnSync('node', [join(dir, suite)], { stdio: 'inherit', env: process.env })
  if (res.status !== 0) {
    failed++
    console.error(`✗ ${suite} FAILED`)
  } else {
    console.log(`✓ ${suite} passed`)
  }
}

console.log(`\n${suites.length - failed}/${suites.length} suites passed`)
process.exit(failed ? 1 : 0)
