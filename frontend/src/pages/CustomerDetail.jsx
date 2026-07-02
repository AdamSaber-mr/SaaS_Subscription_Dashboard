import { useDashboard } from '../store/DashboardContext.jsx'
import { usd, initial, avatarStyle, fmtDate, fmtMonth } from '../lib/format.js'
import { statusStyle } from '../lib/badges.js'
import StatCard from '../components/StatCard.jsx'

export default function CustomerDetail() {
  const { customerDetail: sel, go, openChangePlan, openCancel, lang, t, isMobile } = useDashboard()

  const EV_LABEL = { new: t('detail.evNew'), expansion: t('detail.evExpansion'), contraction: t('detail.evContraction'), churn: t('detail.evChurn') }

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
      {t('detail.back')}
    </button>
  )

  if (!sel) {
    return (
      <div style={{ maxWidth: '980px' }}>
        {back}
        <div style={{ fontSize: '13px', color: 'var(--text-3,#9a9aa6)' }}>{t('detail.loading')}</div>
      </div>
    )
  }

  const paid = sel.invoices.filter((i) => i.status === 'paid')
  const isActive = sel.status === 'active'
  const target = { subId: sel.subscriptionId, name: sel.name, planId: sel.plan?.id, mrr: sel.currentMrr }

  const stats = [
    { label: t('detail.currentPlan'), value: sel.plan?.name ?? '—', color: 'var(--text)' },
    { label: t('detail.currentMrr'), value: isActive ? usd(sel.currentMrr) : '$0', color: 'var(--text)' },
    { label: t('detail.lifetimePaid'), value: usd(sel.lifetimePaid), color: 'var(--accent)' },
    { label: t('detail.since'), value: fmtMonth(sel.signedUpAt, lang), color: 'var(--text)' },
  ]

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
          <span style={statusStyle(isActive)}>{isActive ? t('customers.statusActive') : t('customers.statusChurned')}</span>
        </div>
        <div style={{ display: 'flex', gap: '9px' }}>
          <button
            onClick={() => openChangePlan(target)}
            style={{ padding: '9px 14px', borderRadius: '10px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer' }}
          >
            {t('detail.changePlan')}
          </button>
          <button
            onClick={() => (isActive ? openCancel(target) : openChangePlan(target))}
            style={
              isActive
                ? { padding: '9px 14px', borderRadius: '10px', border: '1px solid var(--border-strong)', background: 'var(--surface)', color: 'var(--neg)', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer' }
                : { padding: '9px 14px', borderRadius: '10px', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer' }
            }
          >
            {isActive ? t('detail.cancel') : t('detail.reactivate')}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '14px', marginBottom: '20px' }}>
        {stats.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1.25fr', gap: '18px' }}>
        <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '16px', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)', marginBottom: '16px' }}>{t('detail.timeline')}</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sel.timeline.map((ev, i) => {
              const color = ev.type === 'new' ? 'var(--accent)' : ev.type === 'churn' ? 'var(--neg)' : ev.type === 'expansion' ? 'var(--pos)' : 'var(--text-3)'
              let det = ''
              if (ev.type === 'new') det = ' · ' + t('detail.planSuffix', { plan: ev.toPlan || '' })
              else if (ev.type === 'expansion' || ev.type === 'contraction') det = ' · ' + ev.fromPlan + ' → ' + ev.toPlan
              else if (ev.type === 'churn') det = ' · ' + t('detail.planSuffix', { plan: ev.fromPlan || ev.toPlan || '' })
              return (
                <div key={i} style={{ display: 'flex', gap: '13px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '11px', height: '11px', borderRadius: '50%', background: color, border: '2px solid var(--surface)', boxShadow: `0 0 0 1px ${color}`, flex: 'none', marginTop: '3px' }} />
                    {i < sel.timeline.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border)', margin: '3px 0' }} />}
                  </div>
                  <div style={{ paddingBottom: '16px' }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 550, color: 'var(--text,#15151b)' }}>{EV_LABEL[ev.type]}</div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '1px' }}>{fmtDate(ev.date, lang)}{det}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '16px', padding: '20px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>{t('detail.payments')}</div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)' }}>{t('detail.paidSummary', { n: paid.length, amt: usd(sel.lifetimePaid) })}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {sel.invoices.slice(0, 12).map((iv, i) => {
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
                      <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)' }}>{fmtDate(iv.date, lang)}{iv.isRetry ? ' · ' + t('detail.retry') : ''}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: 550, padding: '3px 9px', borderRadius: '20px', color, background: bg }}>{ok ? t('detail.paid') : ref ? t('detail.refunded') : t('detail.failed')}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
