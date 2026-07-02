import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { usd, pct1, hexA } from '../lib/format.js'

export default function Plans() {
  const { plans, planRamp, metrics } = useDashboard()
  const { endMRR: totalMRR } = usePeriodMetrics()

  const mix = Object.fromEntries(metrics.planMix.map((p) => [p.id, p]))
  const counts = plans.map((p) => mix[p.id]?.customers ?? 0)
  const popIdx = counts.indexOf(Math.max(...counts))

  const cards = plans.map((p, pi) => {
    const cnt = counts[pi]
    const mrr = mix[p.id]?.mrr ?? 0
    const share = totalMRR ? mrr / totalMRR : 0
    const pop = pi === popIdx
    return {
      name: p.name,
      blurb: p.blurb,
      price: '$' + p.price.toLocaleString('en-US'),
      interval: p.interval === 'year' ? '/yr' : '/mo',
      mrrNote: p.interval === 'year' ? '$' + p.mrr.toLocaleString('en-US') + '/mo recognized' : 'billed monthly',
      customers: String(cnt),
      mrr: usd(mrr),
      shareStr: pct1(share) + ' of total revenue',
      pop,
      ramp: planRamp[p.id],
    }
  })

  const stack = plans.map((p) => {
    const mrr = mix[p.id]?.mrr ?? 0
    const pct = totalMRR ? mrr / totalMRR : 0
    return { name: p.name, pct: pct1(pct), pctNum: pct, ramp: planRamp[p.id] }
  })

  const bars = plans.map((p) => {
    const mrr = mix[p.id]?.mrr ?? 0
    const pct = totalMRR ? mrr / totalMRR : 0
    return { name: p.name, mrr: usd(mrr), pct: pct1(pct), pctNum: pct, ramp: planRamp[p.id] }
  })

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(195px,1fr))', gap: '16px', marginBottom: '18px' }}>
        {cards.map((p, i) => (
          <div
            key={i}
            style={{
              background: 'var(--surface)',
              border: `1px solid ${p.pop ? p.ramp : 'var(--border)'}`,
              borderRadius: '16px',
              padding: '18px 20px',
              boxShadow: p.pop ? '0 6px 24px ' + hexA(p.ramp, 0.18) : 'var(--shadow)',
              borderTop: `3px solid ${p.ramp}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>{p.name}</div>
              {p.pop && (
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '9.5px', fontWeight: 600, letterSpacing: '.03em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px', color: '#fff', background: p.ramp, whiteSpace: 'nowrap' }}>
                  Most popular
                </span>
              )}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '3px', minHeight: '30px' }}>{p.blurb}</div>
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '26px', fontWeight: 650, letterSpacing: '-0.02em', color: 'var(--text,#15151b)', fontVariantNumeric: 'tabular-nums' }}>{p.price}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-3,#9a9aa6)' }}>{p.interval}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{p.mrrNote}</div>
            <div style={{ height: '1px', background: 'var(--border,#ececef)', margin: '14px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text,#15151b)', fontVariantNumeric: 'tabular-nums' }}>{p.customers}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)' }}>customers</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent,#6E56CF)', fontVariantNumeric: 'tabular-nums' }}>{p.mrr}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)' }}>MRR</div>
              </div>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)', marginTop: '10px', textAlign: 'center' }}>{p.shareStr}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '16px', padding: '22px', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)', marginBottom: '16px' }}>Revenue contribution by plan</div>
        <div style={{ display: 'flex', height: '16px', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px', background: 'var(--surface-2,#f6f6f8)' }}>
          {stack.map((p, i) => (
            <div key={i} style={{ width: (p.pctNum * 100).toFixed(1) + '%', background: p.ramp, height: '100%' }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginBottom: '22px' }}>
          {stack.map((p, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11.5px', color: 'var(--text-2,#6b6b78)' }}>
              <span style={{ width: '9px', height: '9px', borderRadius: '3px', background: p.ramp, flex: 'none' }} />
              {p.name} · {p.pct}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {bars.map((p, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text,#15151b)' }}>{p.name}</span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-2,#6b6b78)', fontVariantNumeric: 'tabular-nums' }}>{p.mrr} · {p.pct}</span>
              </div>
              <div style={{ height: '12px', background: 'var(--surface-2,#f6f6f8)', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ width: (p.pctNum * 100).toFixed(1) + '%', height: '100%', background: p.ramp, borderRadius: '6px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
