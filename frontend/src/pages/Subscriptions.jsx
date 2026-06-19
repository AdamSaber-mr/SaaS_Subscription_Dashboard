import { useDashboard } from '../store/DashboardContext.jsx'
import { PLANS, plan, PLAN_RAMP, monthMeta } from '../lib/engine.js'
import { usd, initial, avatarStyle } from '../lib/format.js'
import { planBadge } from './Customers.jsx'

const GRID = '2fr 1.2fr 1fr 1fr 1.4fr'

export default function Subscriptions() {
  const { customers, subPlanFilter, setSubPlanFilter, openChangePlan, openCancel } = useDashboard()

  const allActive = customers.filter((c) => c.status === 'active')
  const totalMRR = allActive.reduce((a, c) => a + plan(c.planId).mrr, 0)
  const annualCount = allActive.filter((c) => plan(c.planId).interval === 'year').length
  const stats = [
    { label: 'Active subscriptions', value: String(allActive.length), sub: 'currently billing', color: 'var(--text)' },
    { label: 'Total MRR', value: usd(totalMRR), sub: 'recurring per month', color: 'var(--accent)' },
    { label: 'Average MRR', value: usd(allActive.length ? totalMRR / allActive.length : 0), sub: 'per subscription', color: 'var(--text)' },
    { label: 'On annual billing', value: String(annualCount), sub: 'paid yearly upfront', color: 'var(--text)' },
  ]

  const chips = [['all', 'All plans']].concat(PLANS.map((p) => [p.id, p.name]))

  let subs = allActive.slice()
  if (subPlanFilter !== 'all') subs = subs.filter((c) => c.planId === subPlanFilter)
  subs.sort((a, b) => plan(b.planId).mrr - plan(a.planId).mrr)
  const rows = subs.slice(0, 50)

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

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {chips.map(([id, label]) => {
          const a = subPlanFilter === id
          return (
            <button
              key={id}
              onClick={() => setSubPlanFilter(id)}
              style={{
                padding: '7px 13px',
                borderRadius: '9px',
                border: `1px solid ${a ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: a ? 550 : 450,
                whiteSpace: 'nowrap',
                background: a ? 'var(--accent-weak)' : 'var(--surface)',
                color: a ? 'var(--accent)' : 'var(--text-2)',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '16px', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', padding: '13px 20px', borderBottom: '1px solid var(--border,#ececef)', background: 'var(--surface-2,#f6f6f8)', fontSize: '11px', fontWeight: 600, color: 'var(--text-2,#6b6b78)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
          <span>Customer</span>
          <span>Plan</span>
          <span>MRR</span>
          <span>Started</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>
        {rows.map((c) => (
          <div key={c.id} style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', padding: '12px 20px', borderBottom: '1px solid var(--border,#ececef)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
              <div style={avatarStyle(c.name, 30)}>{initial(c.name)}</div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text,#15151b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
            </div>
            <div>
              <span style={planBadge(c.planId)}>{plan(c.planId).name}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 550, color: 'var(--text,#15151b)', fontVariantNumeric: 'tabular-nums' }}>
              {usd(plan(c.planId).mrr)}
              <div style={{ height: '3px', borderRadius: '2px', background: 'var(--surface-2,#f6f6f8)', marginTop: '5px', overflow: 'hidden' }}>
                <div style={{ width: Math.max(6, Math.round((plan(c.planId).mrr / 999) * 100)) + '%', height: '100%', borderRadius: '2px', background: PLAN_RAMP[c.planId] }} />
              </div>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-2,#6b6b78)', fontVariantNumeric: 'tabular-nums' }}>
              {monthMeta(c.signupMonth).short}
              <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)' }}>{plan(c.planId).interval === 'year' ? 'Annual' : 'Monthly'}</div>
            </div>
            <div style={{ display: 'flex', gap: '7px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => openChangePlan(c.id, c.planId)}
                style={{ padding: '6px 11px', borderRadius: '8px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', fontSize: '11.5px', fontWeight: 500, cursor: 'pointer' }}
              >
                Change
              </button>
              <button
                onClick={() => openCancel(c.id)}
                style={{ padding: '6px 11px', borderRadius: '8px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--neg,#e5484d)', fontSize: '11.5px', fontWeight: 500, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        ))}
        <div style={{ padding: '12px 20px', fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)' }}>Showing {rows.length} of {subs.length} active subscriptions</div>
      </div>
    </div>
  )
}
