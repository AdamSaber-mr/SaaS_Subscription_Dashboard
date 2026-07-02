import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { usd, initial, avatarStyle, fmtMonth } from '../lib/format.js'
import { planBadge, statusStyle } from '../lib/badges.js'
import StatCard from '../components/StatCard.jsx'

const GRID = '2.2fr 1.3fr 1fr 1fr 1fr 1.1fr'

export default function Customers() {
  const {
    customerList, metrics, planRamp, maxPlanMrr, period, lang, t,
    search, setSearch, statusFilter, setStatusFilter,
    sortKey, sortDir, toggleSort, page, setPage, openCustomer,
  } = useDashboard()
  const { newCust, endActive, endMRR } = usePeriodMetrics()

  const COLS = [
    ['name', t('customers.colCustomer')],
    ['plan', t('customers.colPlan')],
    ['mrr', t('customers.colMrr')],
    ['country', t('customers.colCountry')],
    ['status', t('customers.colStatus')],
    ['signup', t('customers.colSignup')],
  ]

  const stats = [
    { label: t('customers.active'), value: String(endActive), sub: t('customers.activeSub'), color: 'var(--text)' },
    { label: t('customers.churned'), value: String(metrics.stats.churnedTotal), sub: t('customers.churnedSub'), color: 'var(--neg)' },
    { label: t('customers.newPeriod'), value: String(newCust), sub: t('customers.newPeriodSub', { period: t('periodIn.' + period) }), color: 'var(--pos)' },
    { label: t('customers.totalMrr'), value: usd(endMRR), sub: t('customers.totalMrrSub'), color: 'var(--accent)' },
  ]

  const rows = customerList?.items ?? []
  const total = customerList?.total ?? 0
  const lastPage = customerList?.lastPage ?? 1

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '16px' }}>
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
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
            placeholder={t('customers.search')}
            aria-label={t('customers.search')}
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '10px', border: '1px solid var(--border,#ececef)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', fontSize: '13px', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[['all', t('customers.all')], ['active', t('customers.activeChip')], ['churned', t('customers.churnedChip')]].map(([id, label]) => {
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
        {/* wide table scrolls inside its own card — the page never scrolls sideways */}
        <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '760px' }}>
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
          {rows.map((c) => {
            const active = c.status === 'active'
            return (
              <div
                key={c.id}
                role="link"
                tabIndex={0}
                aria-label={t('customers.openCustomer', { name: c.name })}
                onClick={() => openCustomer(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    openCustomer(c.id)
                  }
                }}
                style={{ display: 'grid', gridTemplateColumns: GRID, gap: '14px', padding: '13px 20px', borderBottom: '1px solid var(--border,#ececef)', cursor: 'pointer', alignItems: 'center' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-2,#f6f6f8)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                onFocus={(e) => (e.currentTarget.style.background = 'var(--surface-2,#f6f6f8)')}
                onBlur={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
                  <div style={avatarStyle(c.name, 34)}>{initial(c.name)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text,#15151b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {c.plan && <span style={planBadge(planRamp[c.plan.id])}>{c.plan.name}</span>}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 550, color: 'var(--text,#15151b)', fontVariantNumeric: 'tabular-nums' }}>
                  {active && c.mrr != null ? usd(c.mrr) : '—'}
                  <div style={{ height: '3px', borderRadius: '2px', background: 'var(--surface-2,#f6f6f8)', marginTop: '5px', overflow: 'hidden' }}>
                    <div style={{ width: (active && c.mrr ? Math.max(6, Math.round((c.mrr / maxPlanMrr) * 100)) : 0) + '%', height: '100%', borderRadius: '2px', background: c.plan ? planRamp[c.plan.id] : 'transparent' }} />
                  </div>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-2,#6b6b78)' }}>{c.country}</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={statusStyle(active)}>{active ? t('customers.statusActive') : t('customers.statusChurned')}</span>
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-2,#6b6b78)', fontVariantNumeric: 'tabular-nums' }}>{fmtMonth(c.signedUpAt, lang)}</div>
              </div>
            )
          })}
        </div>
        </div>
        </div>
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)' }}>
          <span>{t('customers.showing', { x: rows.length, y: total })}</span>
          {lastPage > 1 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={{ padding: '5px 11px', borderRadius: '8px', border: '1px solid var(--border,#ececef)', background: 'var(--surface)', color: page <= 1 ? 'var(--text-3)' : 'var(--text)', fontSize: '11.5px', cursor: page <= 1 ? 'default' : 'pointer' }}
              >
                {t('customers.prev')}
              </button>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{t('customers.page', { x: page, y: lastPage })}</span>
              <button
                onClick={() => setPage(Math.min(lastPage, page + 1))}
                disabled={page >= lastPage}
                style={{ padding: '5px 11px', borderRadius: '8px', border: '1px solid var(--border,#ececef)', background: 'var(--surface)', color: page >= lastPage ? 'var(--text-3)' : 'var(--text)', fontSize: '11.5px', cursor: page >= lastPage ? 'default' : 'pointer' }}
              >
                {t('customers.next')}
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
