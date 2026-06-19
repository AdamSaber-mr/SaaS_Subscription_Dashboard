import { useDashboard } from '../store/DashboardContext.jsx'
import { plan, monthMeta, monthDate } from '../lib/engine.js'
import { usd, initial, avatarStyle } from '../lib/format.js'
import { statusStyle } from './Customers.jsx'

const EV_LABEL = { new: 'Subscribed', expansion: 'Upgraded', contraction: 'Downgraded', churn: 'Canceled' }

export default function CustomerDetail() {
  const { customers, selectedCustomerId, go, openChangePlan, openCancel } = useDashboard()
  const sel = customers.find((c) => c.id === selectedCustomerId)

  const back = (
    <button
      onClick={() => go('customers')}
      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-2,#6b6b78)', fontSize: '12.5px', fontWeight: 500, cursor: 'pointer', padding: 0, marginBottom: '16px' }}
      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text,#15151b)')}
      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-2,#6b6b78)')}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      All customers
    </button>
  )

  if (!sel) return <div style={{ maxWidth: '980px' }}>{back}</div>

  const paid = sel.invoices.filter((i) => i.status === 'paid')
  const ltvActual = paid.reduce((a, i) => a + i.amount, 0)
  const tl = sel.events.slice().reverse()

  const stats = [
    { label: 'Current plan', value: plan(sel.planId).name, color: 'var(--text)' },
    { label: 'Current MRR', value: sel.status === 'active' ? usd(plan(sel.planId).mrr) : '$0', color: 'var(--text)' },
    { label: 'Lifetime paid', value: usd(ltvActual), color: 'var(--accent)' },
    { label: 'Customer since', value: monthMeta(sel.signupMonth).short, color: 'var(--text)' },
  ]

  const isActive = sel.status === 'active'

  return (
    <div style={{ maxWidth: '980px' }}>
      {back}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={avatarStyle(sel.name, 52)}>{initial(sel.name)}</div>
          <div>
            <div style={{ fontSize: '21px', fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--text,#15151b)' }}>{sel.name}</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{sel.email} · {sel.country}</div>
          </div>
          <span style={statusStyle(sel.status)}>{isActive ? 'Active' : 'Churned'}</span>
        </div>
        <div style={{ display: 'flex', gap: '9px' }}>
          <button
            onClick={() => openChangePlan(sel.id, sel.planId)}
            style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer' }}
          >
            Change plan
          </button>
          <button
            onClick={() => (isActive ? openCancel(sel.id) : openChangePlan(sel.id, sel.planId))}
            style={
              isActive
                ? { padding: '9px 14px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--neg)', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer' }
                : { padding: '9px 14px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer' }
            }
          >
            {isActive ? 'Cancel' : 'Reactivate'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '20px' }}>
        {stats.map((s, i) => (
          <div key={i} style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '14px', padding: '15px 16px', boxShadow: 'var(--shadow)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-2,#6b6b78)', fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontSize: '19px', fontWeight: 600, marginTop: '6px', color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.25fr', gap: '18px' }}>
        <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '16px', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)', marginBottom: '16px' }}>Subscription timeline</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tl.map((ev, i) => {
              const color = ev.type === 'new' ? 'var(--accent)' : ev.type === 'churn' ? 'var(--neg)' : ev.type === 'expansion' ? 'var(--pos)' : 'var(--text-3)'
              let det = ''
              if (ev.type === 'new') det = ' · ' + plan(ev.planId).name + ' plan'
              else if (ev.type === 'expansion' || ev.type === 'contraction') det = ' · ' + plan(ev.fromPlan).name + ' → ' + plan(ev.planId).name
              else if (ev.type === 'churn') det = ' · ' + plan(ev.planId).name + ' plan'
              return (
                <div key={i} style={{ display: 'flex', gap: '13px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: color, border: '2px solid var(--surface)', boxShadow: `0 0 0 1px ${color}`, flex: 'none', marginTop: '3px' }} />
                    {i < tl.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border)', margin: '3px 0' }} />}
                  </div>
                  <div style={{ paddingBottom: '16px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 550, color: 'var(--text,#15151b)' }}>{EV_LABEL[ev.type]}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '1px' }}>{monthDate(ev.month, ev.day)}{det}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '16px', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>Payment history</div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)' }}>{paid.length + ' paid · ' + usd(ltvActual)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sel.invoices.slice().reverse().slice(0, 12).map((iv, i) => {
              const ok = iv.status === 'paid'
              const ref = iv.status === 'refunded'
              const color = ok ? 'var(--pos)' : ref ? 'var(--text-2)' : 'var(--neg)'
              const bg = ok ? 'var(--pos-weak)' : ref ? 'var(--surface-2)' : 'var(--neg-weak)'
              const icon = ok ? 'M20 6 9 17l-5-5' : ref ? 'M3 12a9 9 0 1 0 9-9 9 9 0 0 0-9 9zM3 3v6h6' : 'M18 6 6 18M6 6l12 12'
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border,#ececef)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '8px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color, background: bg }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d={icon} />
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text,#15151b)', fontVariantNumeric: 'tabular-nums' }}>{usd(iv.amount)}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)' }}>{monthDate(iv.month, iv.day)}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: 550, padding: '3px 9px', borderRadius: '20px', color, background: bg }}>{ok ? 'Paid' : ref ? 'Refunded' : 'Failed'}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
