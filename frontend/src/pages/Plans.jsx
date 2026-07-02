import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { usd, pct1, hexA } from '../lib/format.js'

const card = {
  background: 'var(--surface,#fff)',
  border: '1px solid var(--border,#ececef)',
  borderRadius: '16px',
  boxShadow: 'var(--shadow)',
}

export default function Plans() {
  const { plans, planRamp, metrics, t } = useDashboard()
  const { endMRR: totalMRR, endActive } = usePeriodMetrics()

  const mix = Object.fromEntries(metrics.planMix.map((p) => [p.id, p]))
  const counts = plans.map((p) => mix[p.id]?.customers ?? 0)
  const popIdx = counts.indexOf(Math.max(...counts))

  const rows = plans.map((p, pi) => {
    const cnt = counts[pi]
    const mrr = mix[p.id]?.mrr ?? 0
    return {
      id: p.id,
      name: p.name,
      blurb: p.blurb,
      price: '$' + p.price.toLocaleString('en-US'),
      interval: p.interval === 'year' ? t('plans.perYr') : t('plans.perMo'),
      mrrNote: p.interval === 'year' ? t('plans.recognized', { mrr: '$' + p.mrr.toLocaleString('en-US') }) : t('plans.billedMonthly'),
      customers: cnt,
      custShare: endActive ? cnt / endActive : 0,
      mrr,
      revShare: totalMRR ? mrr / totalMRR : 0,
      pop: pi === popIdx,
      ramp: planRamp[p.id],
    }
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* PLAN CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))', gap: '16px' }}>
        {rows.map((p) => (
          <div key={p.id} data-enter style={{ ...card, borderTop: `3px solid ${p.ramp}`, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>{p.name}</div>
              {p.pop && (
                <span style={{ fontSize: '9.5px', fontWeight: 650, letterSpacing: '.04em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px', color: p.ramp, background: hexA(p.ramp, 0.14), whiteSpace: 'nowrap' }}>
                  {t('plans.popular')}
                </span>
              )}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '3px', minHeight: '30px' }}>{p.blurb}</div>

            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '27px', fontWeight: 650, letterSpacing: '-0.02em', color: 'var(--text,#15151b)', fontVariantNumeric: 'normal' }}>{p.price}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-3,#9a9aa6)' }}>{p.interval}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{p.mrrNote}</div>

            <div style={{ height: '1px', background: 'var(--border,#ececef)', margin: '14px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text,#15151b)', fontVariantNumeric: 'normal' }}>{p.customers}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)' }}>{t('plans.customers')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text,#15151b)', fontVariantNumeric: 'normal' }}>{usd(p.mrr)}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)' }}>{t('plans.mrr')}</div>
              </div>
            </div>

            {/* Revenue-share meter: fill = plan hue, track = a lighter step of the same hue. */}
            <div style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)', marginBottom: '5px' }}>
                <span>{t('plans.share')}</span>
                <span style={{ color: 'var(--text-2,#6b6b78)', fontWeight: 550 }}>{pct1(p.revShare)}</span>
              </div>
              <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.revShare * 100)} aria-label={t('plans.shareOf', { plan: p.name })} style={{ height: '6px', borderRadius: '4px', background: hexA(p.ramp, 0.16), overflow: 'hidden' }}>
                <div style={{ width: (p.revShare * 100).toFixed(1) + '%', height: '100%', borderRadius: '4px', background: p.ramp }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REVENUE DISTRIBUTION */}
      <div data-enter style={{ ...card, padding: '22px' }}>
        <div style={{ marginBottom: '4px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>{t('plans.contribution')}</div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginBottom: '18px' }}>{t('plans.contributionSub', { total: usd(totalMRR) })}</div>

        {/* Stacked distribution bar — segments separated by 2px of surface. */}
        <div style={{ display: 'flex', gap: '2px', height: '14px', borderRadius: '7px', overflow: 'hidden', marginBottom: '12px' }}>
          {rows.map((p) => (
            <div key={p.id} style={{ width: (p.revShare * 100).toFixed(2) + '%', background: p.ramp, borderRadius: '3px', minWidth: p.revShare > 0 ? '4px' : 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: '24px' }}>
          {rows.map((p) => (
            <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11.5px', color: 'var(--text-2,#6b6b78)' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: p.ramp, flex: 'none' }} />
              {p.name}
              <span style={{ color: 'var(--text-3,#9a9aa6)', fontVariantNumeric: 'tabular-nums' }}>{pct1(p.revShare)}</span>
            </span>
          ))}
        </div>

        {/* Per-tier rows: thin bars on a quiet track, values in text ink. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {rows.map((p) => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 150px', gap: '16px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 550, color: 'var(--text,#15151b)' }}>{p.name}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)' }}>{t('plans.tierRow', { n: p.customers, pct: pct1(p.custShare) })}</div>
              </div>
              <div style={{ height: '10px', borderRadius: '5px', background: 'var(--surface-2,#f6f6f8)', overflow: 'hidden' }}>
                <div style={{ width: (p.revShare * 100).toFixed(1) + '%', height: '100%', borderRadius: '5px', background: p.ramp }} />
              </div>
              <div style={{ textAlign: 'right', fontSize: '12.5px', color: 'var(--text,#15151b)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {usd(p.mrr)}
                <span style={{ color: 'var(--text-3,#9a9aa6)', fontWeight: 450 }}> · {pct1(p.revShare)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
