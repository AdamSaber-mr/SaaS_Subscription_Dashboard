import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { usd, initial, avatarStyle, fmtMonth } from '../lib/format.js'
import { planBadge } from '../lib/badges.js'
import StatCard from '../components/StatCard.jsx'

const GRID = '2fr 1.2fr 1fr 1fr 1.4fr'

export default function Subscriptions() {
  const { plans, planRamp, maxPlanMrr, metrics, subscriptionList, subPlanFilter, setSubPlanFilter, openChangePlan, openCancel, lang, t } = useDashboard()
  const { endMRR, endActive } = usePeriodMetrics()

  const annualCount = metrics.planMix.filter((p) => p.interval === 'year').reduce((a, p) => a + p.customers, 0)
  const stats = [
    { label: t('subs.active'), value: String(endActive), sub: t('subs.activeSub'), color: 'var(--text)' },
    { label: t('subs.totalMrr'), value: usd(endMRR), sub: t('subs.totalMrrSub'), color: 'var(--accent)' },
    { label: t('subs.avgMrr'), value: usd(endActive ? endMRR / endActive : 0), sub: t('subs.avgMrrSub'), color: 'var(--text)' },
    { label: t('subs.annual'), value: String(annualCount), sub: t('subs.annualSub'), color: 'var(--text)' },
  ]

  const chips = [['all', t('subs.allPlans')]].concat(plans.map((p) => [p.id, p.name]))
  const rows = subscriptionList?.items ?? []
  const total = subscriptionList?.total ?? 0

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '16px' }}>
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
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
          <span>{t('subs.colCustomer')}</span>
          <span>{t('subs.colPlan')}</span>
          <span>{t('subs.colMrr')}</span>
          <span>{t('subs.colStarted')}</span>
          <span style={{ textAlign: 'right' }}>{t('subs.colActions')}</span>
        </div>
        {rows.map((s) => (
          <div key={s.id} style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', padding: '12px 20px', borderBottom: '1px solid var(--border,#ececef)', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
              <div style={avatarStyle(s.customer.name, 30)}>{initial(s.customer.name)}</div>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text,#15151b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.customer.name}</span>
            </div>
            <div>
              <span style={planBadge(planRamp[s.plan.id])}>{s.plan.name}</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 550, color: 'var(--text,#15151b)', fontVariantNumeric: 'tabular-nums' }}>
              {usd(s.mrr)}
              <div style={{ height: '3px', borderRadius: '2px', background: 'var(--surface-2,#f6f6f8)', marginTop: '5px', overflow: 'hidden' }}>
                <div style={{ width: Math.max(6, Math.round((s.mrr / maxPlanMrr) * 100)) + '%', height: '100%', borderRadius: '2px', background: planRamp[s.plan.id] }} />
              </div>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-2,#6b6b78)', fontVariantNumeric: 'tabular-nums' }}>
              {fmtMonth(s.startedAt, lang)}
              <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)' }}>{s.interval === 'year' ? t('subs.yearly') : t('subs.monthly')}</div>
            </div>
            <div style={{ display: 'flex', gap: '7px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => openChangePlan({ subId: s.id, name: s.customer.name, planId: s.plan.id, mrr: s.mrr })}
                style={{ padding: '6px 11px', borderRadius: '8px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', fontSize: '11.5px', fontWeight: 500, cursor: 'pointer' }}
              >
                {t('subs.change')}
              </button>
              <button
                onClick={() => openCancel({ subId: s.id, name: s.customer.name, mrr: s.mrr })}
                style={{ padding: '6px 11px', borderRadius: '8px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--neg,#e5484d)', fontSize: '11.5px', fontWeight: 500, cursor: 'pointer' }}
              >
                {t('subs.cancel')}
              </button>
            </div>
          </div>
        ))}
        <div style={{ padding: '12px 20px', fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)' }}>{t('subs.showing', { x: rows.length, y: total })}</div>
      </div>
    </div>
  )
}
