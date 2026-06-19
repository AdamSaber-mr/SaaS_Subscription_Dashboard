import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { plan, PLAN_RAMP, LADDER, monthMeta, periodLabel } from '../lib/engine.js'
import { usd, initial, avatarStyle } from '../lib/format.js'

const GRID = '2.2fr 1.3fr 1fr 1fr 1fr 1.1fr'

function planBadge(pid) {
  return { fontSize: '11px', fontWeight: 550, padding: '3px 9px', borderRadius: '7px', color: '#fff', background: PLAN_RAMP[pid] }
}
function statusStyle(st) {
  return {
    fontSize: '11px',
    fontWeight: 550,
    padding: '3px 9px',
    borderRadius: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: st === 'active' ? 'var(--pos)' : 'var(--text-3)',
    background: st === 'active' ? 'var(--pos-weak)' : 'var(--surface-2)',
  }
}

const COLS = [
  ['name', 'Customer'],
  ['plan', 'Plan'],
  ['mrr', 'MRR'],
  ['country', 'Country'],
  ['status', 'Status'],
  ['signup', 'Signed up'],
]

export default function Customers() {
  const {
    customers, period, search, setSearch, statusFilter, setStatusFilter,
    sortKey, sortDir, toggleSort, openCustomer,
  } = useDashboard()
  const { newCust } = usePeriodMetrics()

  const activeCount = customers.filter((c) => c.status === 'active').length
  const churnedCount = customers.length - activeCount
  const totalActiveMRR = customers.filter((c) => c.status === 'active').reduce((a, c) => a + plan(c.planId).mrr, 0)
  const stats = [
    { label: 'Active customers', value: String(activeCount), sub: 'paying right now', color: 'var(--text)' },
    { label: 'Churned', value: String(churnedCount), sub: 'cancelled to date', color: 'var(--neg)' },
    { label: 'New this period', value: String(newCust), sub: 'signed up in ' + periodLabel(period), color: 'var(--pos)' },
    { label: 'Total MRR', value: usd(totalActiveMRR), sub: 'from active subscriptions', color: 'var(--accent)' },
  ]

  let list = customers.slice()
  if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter)
  const q = search.trim().toLowerCase()
  if (q) list = list.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) || c.email.toLowerCase().includes(q))
  const dir = sortDir === 'desc' ? -1 : 1
  list.sort((a, b) => {
    let x, y
    if (sortKey === 'mrr') {
      x = a.status === 'active' ? plan(a.planId).mrr : 0
      y = b.status === 'active' ? plan(b.planId).mrr : 0
    } else if (sortKey === 'plan') {
      x = LADDER.indexOf(a.planId)
      y = LADDER.indexOf(b.planId)
    } else if (sortKey === 'signup') {
      x = a.signupMonth * 100 + a.signupDay
      y = b.signupMonth * 100 + b.signupDay
    } else if (sortKey === 'name') {
      return a.name.localeCompare(b.name) * dir
    } else if (sortKey === 'country') {
      return a.country.localeCompare(b.country) * dir
    } else if (sortKey === 'status') {
      x = a.status === 'active' ? 1 : 0
      y = b.status === 'active' ? 1 : 0
    }
    return (x - y) * dir
  })
  const rows = list.slice(0, 40)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '16px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '14px', padding: '15px 16px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-2,#6b6b78)', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: '21px', fontWeight: 600, letterSpacing: '-0.01em', marginTop: '6px', color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-3,#9a9aa6)" strokeWidth="2" strokeLinecap="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3-3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers…"
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '10px', border: '1px solid var(--border,#ececef)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[['all', 'All'], ['active', 'Active'], ['churned', 'Churned']].map(([id, label]) => {
            const a = statusFilter === id
            return (
              <button
                key={id}
                onClick={() => setStatusFilter(id)}
                style={{
                  padding: '7px 13px',
                  borderRadius: '9px',
                  border: `1px solid ${a ? 'var(--accent)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: a ? 550 : 450,
                  background: a ? 'var(--accent-weak)' : 'var(--surface)',
                  color: a ? 'var(--accent)' : 'var(--text-2)',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '16px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', padding: '13px 20px', borderBottom: '1px solid var(--border,#ececef)', background: 'var(--surface-2,#f6f6f8)' }}>
          {COLS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => toggleSort(key)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', padding: 0, color: sortKey === key ? 'var(--text)' : 'var(--text-2)' }}
            >
              {label}
              <span style={{ opacity: 0.7 }}>{sortKey === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}</span>
            </button>
          ))}
        </div>
        <div>
          {rows.map((c) => (
            <div
              key={c.id}
              onClick={() => openCustomer(c.id)}
              style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', padding: '13px 20px', borderBottom: '1px solid var(--border,#ececef)', cursor: 'pointer', alignItems: 'center' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2,#f6f6f8)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                <div style={avatarStyle(c.name, 34)}>{initial(c.name)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text,#15151b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={planBadge(c.planId)}>{plan(c.planId).name}</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 550, color: 'var(--text,#15151b)', fontVariantNumeric: 'tabular-nums' }}>
                {c.status === 'active' ? usd(plan(c.planId).mrr) : '—'}
                <div style={{ height: '3px', borderRadius: '2px', background: 'var(--surface-2,#f6f6f8)', marginTop: '5px', overflow: 'hidden' }}>
                  <div style={{ width: (c.status === 'active' ? Math.max(6, Math.round((plan(c.planId).mrr / 999) * 100)) : 0) + '%', height: '100%', borderRadius: '2px', background: PLAN_RAMP[c.planId] }} />
                </div>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-2,#6b6b78)' }}>{c.country}</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={statusStyle(c.status)}>{c.status === 'active' ? 'Active' : 'Churned'}</span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-2,#6b6b78)', fontVariantNumeric: 'tabular-nums' }}>{monthMeta(c.signupMonth).short}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 20px', fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)' }}>Showing {rows.length} of {list.length} customers</div>
      </div>
    </div>
  )
}

export { planBadge, statusStyle }
