import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { usd, usdShort, pct1, spark } from '../lib/format.js'

function iconChip(kind) {
  const mp = {
    pos: ['var(--pos)', 'var(--pos-weak)'],
    neg: ['var(--neg)', 'var(--neg-weak)'],
    accent: ['var(--accent)', 'var(--accent-weak)'],
  }
  const a = mp[kind]
  return { width: '36px', height: '36px', borderRadius: '11px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a[0], background: a[1] }
}

// 12-point sparkline: 2px line, endpoint dot with a surface ring.
function Spark({ data, color }) {
  const d = spark(data)
  const W = 120
  const H = 34
  const mx = Math.max(...data) * 1.05 || 1
  const mn = Math.min(...data) * 0.96
  const range = mx - mn || 1
  const ey = H - ((data[data.length - 1] - mn) / range) * H
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '30px', overflow: 'visible' }} aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
      <circle cx={W} cy={ey} r="3" fill={color} stroke="var(--surface,#fff)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function Insights() {
  const { metrics, period, t } = useDashboard()
  const M = usePeriodMetrics()
  const { newM, expM, conM, chuM, net, endMRR, endActive, newCust, chuCust, custChurn, nrr } = M
  const pl = t('periodIn.' + period)
  const T = metrics.trend
  const last12 = (arr) => arr.slice(-12)

  const topPlan = metrics.planMix
    .map((p) => ({ name: p.name, cnt: p.customers, mrr: p.mrr }))
    .sort((a, b) => b.mrr - a.mrr)[0]

  const heroChips = [
    { label: t('insights.chipGains'), value: '+' + usdShort(newM + expM), color: 'var(--pos)' },
    { label: t('insights.chipLosses'), value: '−' + usdShort(conM + chuM), color: 'var(--neg)' },
    { label: t('insights.chipNrr'), value: pct1(nrr), color: nrr >= 1 ? 'var(--pos)' : 'var(--neg)' },
    { label: t('insights.chipActive'), value: String(endActive), color: 'var(--text)' },
  ]

  const cards = [
    { icon: net >= 0 ? 'M3 17l6-6 4 4 8-8M21 7v6h-6' : 'M3 7l6 6 4-4 8 8M21 17v-6h-6', chip: net >= 0 ? 'pos' : 'neg', stat: (net >= 0 ? '+' : '') + usd(net), statColor: net >= 0 ? 'var(--pos)' : 'var(--neg)', title: net >= 0 ? t('insights.growingTitle') : t('insights.shrinkingTitle'), body: t(net >= 0 ? 'insights.growingBody' : 'insights.shrinkingBody', { period: pl, mrr: usd(endMRR) }), trend: last12(T.mrr), trendColor: 'var(--accent)' },
    { icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M19 8v6M22 11h-6', chip: 'accent', stat: '+' + usd(newM), statColor: 'var(--accent)', title: t('insights.newTitle'), body: t('insights.newBody', { n: newCust, amt: usd(newM) }), trend: last12(T.newM), trendColor: 'var(--accent)' },
    { icon: 'M12 19V5M5 12l7-7 7 7', chip: 'pos', stat: '+' + usd(expM), statColor: 'var(--pos)', title: t('insights.upgradeTitle'), body: t('insights.upgradeBody', { amt: usd(expM) }), trend: last12(T.expM), trendColor: 'var(--pos)' },
    { icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 11h-6', chip: 'neg', stat: '−' + usd(chuM), statColor: 'var(--neg)', title: t('insights.cancelTitle'), body: t('insights.cancelBody', { n: chuCust, amt: usd(chuM), pct: pct1(custChurn) }), trend: last12(T.chuM), trendColor: 'var(--neg)' },
    { icon: 'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5', chip: nrr >= 1 ? 'pos' : 'neg', stat: pct1(nrr), statColor: nrr >= 1 ? 'var(--pos)' : 'var(--neg)', title: nrr >= 1 ? t('insights.nrrGoodTitle') : t('insights.nrrBadTitle'), body: t(nrr >= 1 ? 'insights.nrrGoodBody' : 'insights.nrrBadBody', { pct: pct1(nrr) }) },
    { icon: 'M12 3 3 8l9 5 9-5zM3 16l9 5 9-5M3 12l9 5 9-5', chip: 'accent', stat: usd(topPlan.mrr), statColor: 'var(--accent)', title: t('insights.topPlanTitle', { plan: topPlan.name }), body: t('insights.topPlanBody', { plan: topPlan.name, n: topPlan.cnt, amt: usd(topPlan.mrr) }) },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '16px' }}>
      {/* HERO */}
      <div
        data-enter
        style={{
          gridColumn: '1/-1',
          background: 'linear-gradient(135deg,var(--accent-weak),var(--surface) 55%)',
          border: '1px solid var(--border,#ececef)',
          borderRadius: '18px',
          padding: '26px 28px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px 40px',
        }}
      >
        <div style={{ minWidth: '260px', flex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', fontWeight: 650, letterSpacing: '.05em', textTransform: 'uppercase', color: net >= 0 ? 'var(--pos)' : 'var(--neg)', background: net >= 0 ? 'var(--pos-weak)' : 'var(--neg-weak)', padding: '4px 10px', borderRadius: '20px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
            {net >= 0 ? t('insights.healthy') : t('insights.attention')}
          </div>
          {/* Hero figure: one per view, ≥48px, proportional figures. */}
          <div style={{ fontSize: '48px', lineHeight: 1.1, fontWeight: 680, letterSpacing: '-0.025em', color: 'var(--text,#15151b)', marginTop: '12px', fontVariantNumeric: 'normal' }}>
            {(net >= 0 ? '+' : '') + usd(net)}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-2,#6b6b78)', marginTop: '4px' }}>{t('insights.heroLabel', { period: pl })}</div>
          <div style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--text-2,#6b6b78)', marginTop: '10px', maxWidth: '560px', textWrap: 'pretty' }}>
            {t('insights.heroBody', { n: newCust, added: usd(newM + expM), removed: usd(conM + chuM), mrr: usd(endMRR) })}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(130px,auto))', gap: '16px 36px' }}>
          {heroChips.map((ch, i) => (
            <div key={i} style={{ borderLeft: '2px solid var(--border,#ececef)', paddingLeft: '12px' }}>
              <div style={{ fontSize: '20px', fontWeight: 650, letterSpacing: '-0.01em', color: ch.color, fontVariantNumeric: 'normal' }}>{ch.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{ch.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* INSIGHT CARDS */}
      {cards.map((c, i) => (
        <div
          key={i}
          data-enter
          style={{
            background: 'var(--surface,#fff)',
            border: '1px solid var(--border,#ececef)',
            borderRadius: '16px',
            padding: '20px 22px 16px',
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
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={c.icon} />
              </svg>
            </div>
            <span style={{ fontSize: '21px', fontWeight: 650, letterSpacing: '-0.01em', fontVariantNumeric: 'normal', color: c.statColor }}>{c.stat}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14.5px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text,#15151b)', marginBottom: '5px' }}>{c.title}</div>
            <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-2,#6b6b78)', textWrap: 'pretty' }}>{c.body}</div>
          </div>
          {c.trend && (
            <div style={{ borderTop: '1px solid var(--border,#ececef)', paddingTop: '10px' }}>
              <Spark data={c.trend} color={c.trendColor} />
              <div style={{ fontSize: '10px', color: 'var(--text-3,#9a9aa6)', marginTop: '3px' }}>{t('insights.last12')}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
