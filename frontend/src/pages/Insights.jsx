import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { PLANS, periodLabel } from '../lib/engine.js'
import { usd, usdShort, pct1 } from '../lib/format.js'

function iconChip(kind) {
  const mp = {
    pos: ['var(--pos)', 'var(--pos-weak)'],
    neg: ['var(--neg)', 'var(--neg-weak)'],
    accent: ['var(--accent)', 'var(--accent-weak)'],
  }
  const a = mp[kind]
  return { width: '38px', height: '38px', borderRadius: '11px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a[0], background: a[1] }
}

export default function Insights() {
  const { customers, period } = useDashboard()
  const M = usePeriodMetrics()
  const { newM, expM, conM, chuM, net, endMRR, endActive, newCust, chuCust, custChurn, nrr } = M
  const pl = periodLabel(period)

  const topPlan = PLANS.map((p) => {
    const cnt = customers.filter((c) => c.status === 'active' && c.planId === p.id).length
    return { name: p.name, cnt, mrr: cnt * p.mrr }
  }).sort((a, b) => b.mrr - a.mrr)[0]

  const hero = {
    tag: net >= 0 ? 'Healthy growth' : 'Needs attention',
    headline: (net >= 0 ? '+' : '') + usd(net) + ' net new MRR',
    sub:
      'Over the ' + pl + ', ' + newCust + ' new customers plus upgrades added ' + usd(newM + expM) +
      ', while downgrades and cancellations removed ' + usd(conM + chuM) + '. You ended at ' + usd(endMRR) + ' in monthly recurring revenue.',
    chips: [
      { label: 'New + upgrades', value: '+' + usdShort(newM + expM), color: 'var(--pos)' },
      { label: 'Downgrades + cancels', value: '−' + usdShort(conM + chuM), color: 'var(--neg)' },
      { label: 'Net revenue retention', value: pct1(nrr), color: nrr >= 1 ? 'var(--pos)' : 'var(--neg)' },
      { label: 'Active customers', value: String(endActive), color: 'var(--text)' },
    ],
  }

  const cards = [
    { icon: net >= 0 ? 'M3 17l6-6 4 4 8-8M21 7v6h-6' : 'M3 7l6 6 4-4 8 8M21 17v-6h-6', chip: net >= 0 ? 'pos' : 'neg', stat: (net >= 0 ? '+' : '') + usd(net), statColor: net >= 0 ? 'var(--pos)' : 'var(--neg)', title: net >= 0 ? 'Revenue is growing' : 'Revenue is shrinking', body: 'Over the ' + pl + ', your monthly revenue ' + (net >= 0 ? 'climbed' : 'dropped') + ' to ' + usd(endMRR) + ' — the income you can count on every month.' },
    { icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6', chip: 'accent', stat: '+' + usd(newM), statColor: 'var(--accent)', title: 'New customers fuel growth', body: newCust + ' new customers signed up this period, adding ' + usd(newM) + ' in brand-new monthly revenue.' },
    { icon: 'M12 19V5M5 12l7-7 7 7', chip: 'pos', stat: '+' + usd(expM), statColor: 'var(--pos)', title: 'Customers are upgrading', body: 'Existing customers moving up to bigger plans added ' + usd(expM) + ' more per month — growth without a single new sign-up.' },
    { icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 11h-6', chip: 'neg', stat: '−' + usd(chuM), statColor: 'var(--neg)', title: 'Cancellations to watch', body: chuCust + ' customers cancelled, taking ' + usd(chuM) + ' of monthly revenue with them. On average about ' + pct1(custChurn) + ' of customers leave each month.' },
    { icon: 'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5', chip: nrr >= 1 ? 'pos' : 'neg', stat: pct1(nrr), statColor: nrr >= 1 ? 'var(--pos)' : 'var(--neg)', title: nrr >= 1 ? 'You keep more than you lose' : 'Existing revenue is slipping', body: nrr >= 1 ? 'Net revenue retention is ' + pct1(nrr) + '. Even with zero new customers, revenue would still grow because upgrades outweigh cancellations.' : 'Net revenue retention is ' + pct1(nrr) + ' — upgrades are not yet covering downgrades and cancellations from existing customers.' },
    { icon: 'M12 3 3 8l9 5 9-5zM3 16l9 5 9-5M3 12l9 5 9-5', chip: 'accent', stat: usd(topPlan.mrr), statColor: 'var(--accent)', title: topPlan.name + ' brings in the most', body: 'Your ' + topPlan.name + ' plan is the biggest slice of revenue — ' + topPlan.cnt + ' customers paying ' + usd(topPlan.mrr) + ' a month in total.' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '16px' }}>
      <div
        data-enter
        style={{
          gridColumn: '1/-1',
          background: 'linear-gradient(135deg,var(--accent-weak),var(--surface))',
          border: '1px solid var(--border,#ececef)',
          borderRadius: '18px',
          padding: '24px 26px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
        }}
      >
        <div style={{ minWidth: '240px', flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--accent,#6E56CF)' }}>{hero.tag}</div>
          <div style={{ fontSize: '30px', fontWeight: 680, letterSpacing: '-0.02em', color: 'var(--text,#15151b)', marginTop: '7px', fontVariantNumeric: 'tabular-nums' }}>{hero.headline}</div>
          <div style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--text-2,#6b6b78)', marginTop: '9px', maxWidth: '580px', textWrap: 'pretty' }}>{hero.sub}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,auto)', gap: '14px 30px' }}>
          {hero.chips.map((ch, i) => (
            <div key={i}>
              <div style={{ fontSize: '19px', fontWeight: 650, letterSpacing: '-0.01em', color: ch.color, fontVariantNumeric: 'tabular-nums' }}>{ch.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)', marginTop: '1px' }}>{ch.label}</div>
            </div>
          ))}
        </div>
      </div>

      {cards.map((c, i) => (
        <div
          key={i}
          data-enter
          style={{
            background: 'var(--surface,#fff)',
            border: '1px solid var(--border,#ececef)',
            borderRadius: '16px',
            padding: '20px 22px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '13px',
            transition: 'box-shadow .2s, border-color .2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 6px 22px rgba(16,16,20,0.09)'
            e.currentTarget.style.borderColor = 'var(--border-strong,#e0e0e6)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow)'
            e.currentTarget.style.borderColor = 'var(--border,#ececef)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={iconChip(c.chip)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={c.icon} />
              </svg>
            </div>
            <span style={{ fontSize: '21px', fontWeight: 650, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', color: c.statColor }}>{c.stat}</span>
          </div>
          <div>
            <div style={{ fontSize: '14.5px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text,#15151b)', marginBottom: '5px' }}>{c.title}</div>
            <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-2,#6b6b78)', textWrap: 'pretty' }}>{c.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
