// Simulated SaaS revenue engine.
//
// Generates 18 months (Jan 2025 → Jun 2026) of a believable customer lifecycle
// — sign-ups, upgrades, downgrades, churn and invoices — from a fixed seed, so
// every metric on the dashboard is derived from the same underlying events and
// they all agree with each other (ARR = MRR×12, net MRR = new+exp−contr−churn, …).
//
// When the Laravel backend lands, replace the generated `customers` array with
// real API data shaped the same way and the rest of the UI keeps working.

export const N = 18 // months of history

export const PLANS = [
  { id: 'starter', name: 'Starter', price: 29, interval: 'month', mrr: 29, blurb: 'For small teams getting started' },
  { id: 'growth', name: 'Growth', price: 99, interval: 'month', mrr: 99, blurb: 'Growing teams that need more room' },
  { id: 'scale', name: 'Scale', price: 299, interval: 'month', mrr: 299, blurb: 'Scaling companies, advanced controls' },
  { id: 'enterprise', name: 'Enterprise', price: 11988, interval: 'year', mrr: 999, blurb: 'Custom terms, billed annually' },
]

export const LADDER = ['starter', 'growth', 'scale', 'enterprise']

export const PLAN_RAMP = {
  starter: '#C3B8EE',
  growth: '#9A84E6',
  scale: '#6E56CF',
  enterprise: '#4B3494',
}

export function plan(id) {
  return PLANS.find((p) => p.id === id)
}

// --- deterministic RNG -----------------------------------------------------
function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick(rng, arr, w) {
  let r = rng() * w.reduce((a, b) => a + b, 0)
  for (let i = 0; i < arr.length; i++) {
    r -= w[i]
    if (r <= 0) return arr[i]
  }
  return arr[arr.length - 1]
}

// --- month helpers ---------------------------------------------------------
const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function monthMeta(i) {
  // index 0 = Jan 2025 ... index 17 = Jun 2026
  const base = 2025 * 12 + 0
  const t = base + i
  const y = Math.floor(t / 12)
  const mo = t % 12
  return { y, mo, short: SHORT[mo] + " '" + String(y).slice(2), long: LONG[mo] + ' ' + y }
}

export function monthDate(i, day) {
  const m = monthMeta(i)
  const dd = String(day).padStart(2, '0')
  return m.short.replace(/ '\d+/, '') + ' ' + dd + ', ' + m.y
}

function planAtMonth(c, m) {
  let p = null
  for (const e of c.events) {
    if (e.month > m) break
    if (e.type === 'new' || e.type === 'expansion' || e.type === 'contraction') p = e.planId
    if (e.type === 'churn' && e.month < m) p = null
  }
  return p
}

// --- data generation -------------------------------------------------------
export function generateData() {
  const rng = mulberry32(990077)
  const A = ['North', 'Bright', 'Hyper', 'Cloud', 'Data', 'Next', 'Vertex', 'Atlas', 'Lumen', 'Orbit', 'Pine', 'Quartz', 'Signal', 'Stride', 'Vela', 'Aero', 'Nova', 'Echo', 'Flux', 'Iron', 'Maple', 'Onyx', 'Polar', 'Ridge', 'Sage', 'Tidal', 'Umbra', 'Zephyr', 'Cedar', 'Delta', 'Ember', 'Fable', 'Grove', 'Harbor', 'Juno', 'Kepler', 'Lattice']
  const B = ['Labs', 'Systems', 'Works', 'Soft', 'Cloud', 'AI', 'Health', 'Pay', 'Logic', 'Metrics', 'Stack', 'Flow', 'Hub', 'Base', 'Grid', 'Forge', 'Loop', 'Desk', 'Bit', 'Core', 'Sync', 'Yard', 'Group', 'Digital', 'Ventures']
  const C = [['United States', 'US'], ['United Kingdom', 'GB'], ['Germany', 'DE'], ['Netherlands', 'NL'], ['France', 'FR'], ['Canada', 'CA'], ['Australia', 'AU'], ['Sweden', 'SE'], ['Spain', 'ES'], ['India', 'IN']]
  const CW = [40, 12, 10, 7, 6, 6, 5, 4, 4, 6]
  const customers = []
  let id = 1
  const used = {}
  const name = () => {
    let n
    let g = 0
    do {
      n = A[Math.floor(rng() * A.length)] + ' ' + B[Math.floor(rng() * B.length)]
      g++
    } while (used[n] && g < 20)
    used[n] = 1
    return n
  }

  for (let m = 0; m < N; m++) {
    let nNew = Math.round(5 + m * 0.85 + (rng() * 5 - 2.5))
    nNew = Math.max(2, nNew)
    for (let k = 0; k < nNew; k++) {
      const planId = pick(rng, LADDER, [46, 33, 15, 6])
      const cn = name()
      const country = pick(rng, C, CW)
      const c = {
        id: id++,
        name: cn,
        email: 'billing@' + cn.toLowerCase().replace(/[^a-z]/g, '') + '.com',
        country: country[0],
        cc: country[1],
        signupMonth: m,
        signupDay: 1 + Math.floor(rng() * 27),
        planId,
        status: 'active',
        events: [],
      }
      c.events.push({ type: 'new', month: m, planId, mrr: plan(planId).mrr, day: c.signupDay })
      customers.push(c)
    }
    for (const c of customers) {
      if (c.signupMonth >= m || c.status !== 'active') continue
      const ti = LADDER.indexOf(c.planId)
      const churnP = [0.058, 0.04, 0.026, 0.012][ti]
      const upP = ti < 3 ? 0.04 : 0
      const downP = ti > 0 ? 0.02 : 0
      const r = rng()
      const day = 1 + Math.floor(rng() * 27)
      if (r < churnP) {
        c.status = 'churned'
        c.churnMonth = m
        c.events.push({ type: 'churn', month: m, planId: c.planId, mrr: -plan(c.planId).mrr, day })
      } else if (r < churnP + upP) {
        const np = LADDER[ti + 1]
        c.events.push({ type: 'expansion', month: m, fromPlan: c.planId, planId: np, mrr: plan(np).mrr - plan(c.planId).mrr, day })
        c.planId = np
      } else if (r < churnP + upP + downP) {
        const np = LADDER[ti - 1]
        c.events.push({ type: 'contraction', month: m, fromPlan: c.planId, planId: np, mrr: plan(np).mrr - plan(c.planId).mrr, day })
        c.planId = np
      }
    }
  }

  // invoices
  for (const c of customers) {
    c.invoices = []
    const end = c.status === 'churned' ? c.churnMonth : N - 1
    for (let m = c.signupMonth; m <= end; m++) {
      const pid = planAtMonth(c, m)
      if (!pid) continue
      const pl = plan(pid)
      if (pl.interval === 'year' && (m - c.signupMonth) % 12 !== 0) continue
      const amt = pl.price
      const day = Math.min(c.signupDay, 28)
      let status = 'paid'
      const rr = rng()
      if (rr < 0.035) status = 'failed'
      else if (rr < 0.05) status = 'refunded'
      c.invoices.push({ month: m, day, amount: amt, status, planId: pid })
      if (status === 'failed') {
        c.invoices.push({ month: m, day: Math.min(day + 2, 28), amount: amt, status: 'paid', planId: pid, retry: true })
      }
    }
  }
  return customers
}

// --- aggregation -----------------------------------------------------------
export function aggregates(cs) {
  const z = () => new Array(N).fill(0)
  const newM = z(), expM = z(), conM = z(), chuM = z(), mrrEnd = z(), activeC = z(), newC = z(), chuC = z()
  for (const c of cs) {
    for (const e of c.events) {
      if (e.type === 'new') {
        newM[e.month] += e.mrr
        newC[e.month]++
      } else if (e.type === 'expansion') expM[e.month] += e.mrr
      else if (e.type === 'contraction') conM[e.month] += -e.mrr
      else if (e.type === 'churn') {
        chuM[e.month] += -e.mrr
        chuC[e.month]++
      }
    }
  }
  let run = 0
  for (let m = 0; m < N; m++) {
    run += newM[m] + expM[m] - conM[m] - chuM[m]
    mrrEnd[m] = run
  }
  for (let m = 0; m < N; m++) {
    let n = 0
    for (const c of cs) {
      if (c.signupMonth <= m && !(c.status === 'churned' && c.churnMonth <= m)) n++
    }
    activeC[m] = n
  }
  return { newM, expM, conM, chuM, mrrEnd, activeC, newC, chuC }
}

// Index range [start, end] for a selected period.
export function range(p) {
  const e = N - 1
  if (p === 'this_month') return [e, e]
  if (p === 'last_month') return [e - 1, e - 1]
  if (p === 'last_quarter') return [e - 2, e]
  return [e - 11, e]
}

// Derive every period metric used across the dashboard from the aggregates.
export function periodMetrics(A, p) {
  const [s, e] = range(p)
  const sum = (arr) => {
    let t = 0
    for (let i = s; i <= e; i++) t += arr[i]
    return t
  }
  const newM = sum(A.newM), expM = sum(A.expM), conM = sum(A.conM), chuM = sum(A.chuM)
  const startMRR = s > 0 ? A.mrrEnd[s - 1] : 0
  const endMRR = A.mrrEnd[e]
  const net = newM + expM - conM - chuM
  const startActive = s > 0 ? A.activeC[s - 1] : 0
  const endActive = A.activeC[e]
  let chuCust = 0, newCust = 0
  for (let i = s; i <= e; i++) {
    chuCust += A.chuC[i]
    newCust += A.newC[i]
  }
  // churn as average monthly rate over the period (stable across 1- and 12-month windows)
  let _mc = 0, _mr = 0, _nm = 0
  for (let i = s; i <= e; i++) {
    if (i > 0) {
      if (A.activeC[i - 1]) _mc += A.chuC[i] / A.activeC[i - 1]
      if (A.mrrEnd[i - 1]) _mr += A.chuM[i] / A.mrrEnd[i - 1]
      _nm++
    }
  }
  const custChurn = _nm ? _mc / _nm : 0
  const revChurn = _nm ? _mr / _nm : 0
  const arpu = endActive ? endMRR / endActive : 0
  const ltv = custChurn ? arpu / custChurn : 0
  const nrr = startMRR ? (startMRR + expM - conM - chuM) / startMRR : 0
  const quick = conM + chuM ? (newM + expM) / (conM + chuM) : 0
  return {
    s, e, newM, expM, conM, chuM, startMRR, endMRR, net, startActive, endActive,
    chuCust, newCust, custChurn, revChurn, arpu, ltv, nrr, quick,
  }
}

export const PERIODS = [
  ['this_month', 'This month'],
  ['last_month', 'Last month'],
  ['last_quarter', 'Last quarter'],
  ['last_12', '12 months'],
]

export function periodLabel(p) {
  return PERIODS.find((x) => x[0] === p)[1].toLowerCase()
}
