import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { usd, pct1, delta, spark } from '../lib/format.js'
import KpiCard from '../components/KpiCard.jsx'
import SegToggle from '../components/SegToggle.jsx'
import InfoTip from '../components/InfoTip.jsx'
import MrrTrendChart from '../components/charts/MrrTrendChart.jsx'
import ActiveCustomersChart from '../components/charts/ActiveCustomersChart.jsx'
import MovementsChart from '../components/charts/MovementsChart.jsx'
import FlowChart from '../components/charts/FlowChart.jsx'
import CohortGrid from '../components/charts/CohortGrid.jsx'

const cardBase = {
  background: 'var(--surface,#fff)',
  border: '1px solid var(--border,#ececef)',
  borderRadius: '16px',
  boxShadow: 'var(--shadow)',
}

function ChartCard({ title, tip, subtitle, endLabel, growthLabel, children }) {
  return (
    <div style={{ ...cardBase, padding: '20px 22px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>
            {title}
            <InfoTip text={tip} />
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{subtitle}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '19px', fontWeight: 600, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>{endLabel}</div>
          <div style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--pos,#1f9d5b)' }}>{growthLabel}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const { metrics, period, movementViz, setMovementViz, dashLayout, setDashLayout, t, user, companyName, openNewSub, isMobile } = useDashboard()
  const M = usePeriodMetrics()
  const { newM, expM, conM, chuM, endMRR, endActive, newCust, net, nrr, quick, arpu, ltv, custChurn, revChurn } = M
  const T = metrics.trend
  const periodIn = t('periodIn.' + period)

  const mrrDelta = delta(endMRR, M.startMRR)
  const custDelta = delta(endActive, M.startActive)
  const animDeps = [period, metrics]

  const kpis = [
    { key: 'mrr', label: t('dash.mrr'), tip: t('dash.mrrTip'), value: Math.round(endMRR), format: (x) => usd(x), deltaStr: mrrDelta.str, deltaPos: mrrDelta.pos, sub: t('dash.mrrSub'), valueColor: 'var(--text)', spark: spark(T.mrr.slice(-12)) },
    { key: 'arr', label: t('dash.arr'), tip: t('dash.arrTip'), value: Math.round(endMRR * 12), format: (x) => usd(x), deltaStr: mrrDelta.str, deltaPos: mrrDelta.pos, sub: t('dash.arrSub'), valueColor: 'var(--text)', spark: spark(T.mrr.slice(-12).map((x) => x * 12)) },
    { key: 'cust', label: t('dash.activeCustomers'), tip: t('dash.activeTip'), value: endActive, format: (x) => Math.round(x).toLocaleString('en-US'), deltaStr: custDelta.str, deltaPos: custDelta.pos, sub: t('dash.newThisPeriod', { n: newCust }), valueColor: 'var(--text)', spark: spark(T.activeCustomers.slice(-12)) },
    { key: 'net', label: t('dash.netNewMrr'), tip: t('dash.netTip'), value: Math.round(net), format: (x) => (x >= 0 ? '+' : '') + usd(x), deltaStr: t('period.' + period), deltaNeutral: true, sub: t('dash.netSub'), valueColor: net >= 0 ? 'var(--pos)' : 'var(--neg)', spark: spark(T.newM.slice(-12).map((x, i) => x + T.expM.slice(-12)[i] - T.conM.slice(-12)[i] - T.chuM.slice(-12)[i])) },
  ]

  const statTiles = [
    { label: t('dash.nrr'), value: pct1(nrr), color: nrr >= 1 ? 'var(--pos)' : 'var(--neg)', hint: nrr >= 1 ? t('dash.expanding') : t('dash.contracting'), tip: t('dash.nrrTip') },
    { label: t('dash.quick'), value: quick === null ? '∞' : quick.toFixed(1), color: quick === null || quick >= 4 ? 'var(--pos)' : 'var(--text)', hint: t('dash.quickHint'), tip: t('dash.quickTip') },
    { label: t('dash.arpu'), value: usd(arpu), color: 'var(--text)', hint: t('dash.arpuHint'), tip: t('dash.arpuTip') },
    { label: t('dash.ltv'), value: usd(ltv), color: 'var(--text)', hint: t('dash.ltvHint'), tip: t('dash.ltvTip') },
    { label: t('dash.custChurn'), value: pct1(custChurn), color: 'var(--neg)', hint: t('dash.perMonth'), tip: t('dash.custChurnTip') },
    { label: t('dash.revChurn'), value: pct1(revChurn), color: revChurn < 0 ? 'var(--pos)' : 'var(--neg)', hint: t('dash.perMonth'), tip: t('dash.revChurnTip') },
  ]

  // MRR movements
  const m = { newM, expM, conM, chuM }
  const bmax = Math.max(newM, expM, conM, chuM) || 1
  const bridge = [
    { label: t('dash.newCustomers'), v: newM, color: 'var(--pos)', sign: '+' },
    { label: t('dash.upgrades'), v: expM, color: 'var(--pos)', sign: '+' },
    { label: t('dash.downgrades'), v: conM, color: 'var(--neg)', sign: '−' },
    { label: t('dash.cancellations'), v: chuM, color: 'var(--neg)', sign: '−' },
  ]
  const legend = [
    { label: t('dash.newCustomers'), color: 'var(--pos)', valStr: '+' + usd(newM) },
    { label: t('dash.upgrades'), color: 'var(--pos)', valStr: '+' + usd(expM) },
    { label: t('dash.downgrades'), color: 'var(--neg)', valStr: '−' + usd(conM) },
    { label: t('dash.cancellations'), color: 'var(--neg)', valStr: '−' + usd(chuM) },
  ]

  // layout variation order
  const analyst = dashLayout === 'analyst'
  const dord = analyst ? { kpis: 1, stats: 2, mov: 3, charts: 4, cohort: 5 } : { kpis: 1, charts: 2, mov: 3, stats: 4, cohort: 5 }

  const last = T.mrr.length - 1
  const trendGrowth = '+' + usd(T.mrr[last] - T.mrr[Math.max(0, last - 12)]) + ' ' + t('dash.perYear')
  const custGrowth = '+' + (T.activeCustomers[last] - T.activeCustomers[Math.max(0, last - 12)]) + ' ' + t('dash.perYear')

  // Fresh tenant with no data yet → a friendly onboarding nudge on top.
  const isEmpty = endActive === 0 && metrics.stats.churnedTotal === 0 && endMRR === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {isEmpty && (
        <div
          data-enter
          style={{
            order: 0,
            background: 'linear-gradient(135deg,var(--accent-weak),var(--surface) 60%)',
            border: '1px solid var(--border,#ececef)',
            borderRadius: '18px',
            padding: '24px 26px',
            boxShadow: 'var(--shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ minWidth: '260px', flex: 1 }}>
            <div style={{ fontSize: '19px', fontWeight: 650, letterSpacing: '-0.015em', color: 'var(--text,#15151b)' }}>
              {t('onboarding.welcome', { name: (user?.name || '').split(' ')[0] })}
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.55, color: 'var(--text-2,#6b6b78)', marginTop: '6px', maxWidth: '560px', textWrap: 'pretty' }}>
              {t('onboarding.body', { company: companyName })}
            </div>
          </div>
          <button
            onClick={openNewSub}
            style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '11px 18px', borderRadius: '11px', border: 'none', background: 'var(--accent,#6E56CF)', color: '#fff', fontSize: '13px', fontWeight: 550, cursor: 'pointer', boxShadow: '0 1px 2px rgba(110,86,207,0.3)', whiteSpace: 'nowrap' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t('newSub')}
          </button>
        </div>
      )}
      <div data-enter style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', order: 0 }}>
        <span style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', fontWeight: 500 }}>{t('dash.layout')}</span>
        <SegToggle
          options={[
            ['spacious', t('dash.revenueFirst')],
            ['analyst', t('dash.metricsFirst')],
          ]}
          value={dashLayout}
          onChange={setDashLayout}
        />
      </div>

      {/* KPI ROW */}
      <div style={{ order: dord.kpis, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(195px,1fr))', gap: '16px' }}>
        {kpis.map(({ key, ...k }) => (
          <KpiCard key={key} {...k} animDeps={animDeps} />
        ))}
      </div>

      {/* CHARTS ROW */}
      <div data-enter style={{ order: dord.charts, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : analyst ? '1fr 1fr' : '1.6fr 1fr', gap: '16px' }}>
        <ChartCard
          title={t('dash.trendTitle')}
          tip={t('dash.trendTip')}
          subtitle={t('dash.trendSubtitle')}
          endLabel={usd(endMRR)}
          growthLabel={trendGrowth}
        >
          <MrrTrendChart />
        </ChartCard>
        <ChartCard
          title={t('dash.activeTitle')}
          tip={t('dash.activeChartTip')}
          subtitle={t('dash.netOfChurn')}
          endLabel={String(T.activeCustomers[last])}
          growthLabel={custGrowth}
        >
          <ActiveCustomersChart />
        </ChartCard>
      </div>

      {/* MRR MOVEMENTS */}
      <div data-enter style={{ ...cardBase, padding: '20px 22px 22px', order: dord.mov }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>
              {t('dash.movements')}
              <InfoTip text={t('dash.movementsTip')} />
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{t('dash.movementsSubtitle', { period: periodIn })}</div>
          </div>
          <SegToggle
            options={[
              ['bars', t('dash.chart')],
              ['flow', t('dash.flow')],
              ['bridge', t('dash.breakdown')],
            ]}
            value={movementViz}
            onChange={setMovementViz}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.55fr 1fr', gap: isMobile ? '18px' : '28px', alignItems: 'center' }}>
          <div>
            {movementViz === 'bars' && <MovementsChart m={m} />}
            {movementViz === 'flow' && <FlowChart m={m} net={net} />}
            {movementViz === 'bridge' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', padding: '4px 0' }}>
                {bridge.map((r, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '108px 1fr 92px', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-2,#6b6b78)', fontWeight: 500 }}>{r.label}</span>
                    <div style={{ height: '22px', background: 'var(--surface-2,#f6f6f8)', borderRadius: '6px', overflow: 'hidden', display: 'flex', justifyContent: r.sign === '+' ? 'flex-start' : 'flex-end' }}>
                      <div style={{ width: ((r.v / bmax) * 100).toFixed(1) + '%', height: '100%', background: r.color, borderRadius: '6px' }} />
                    </div>
                    <span style={{ fontSize: '12.5px', fontWeight: 600, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: r.color }}>{r.sign + usd(r.v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={isMobile ? { borderTop: '1px solid var(--border,#ececef)', paddingTop: '16px' } : { borderLeft: '1px solid var(--border,#ececef)', paddingLeft: '26px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-2,#6b6b78)', fontWeight: 500 }}>{t('dash.netChange')}</div>
            <div style={{ fontSize: '30px', fontWeight: 650, letterSpacing: '-0.02em', marginTop: '6px', color: net >= 0 ? 'var(--pos)' : 'var(--neg)', fontVariantNumeric: 'tabular-nums' }}>
              {(net >= 0 ? '+' : '') + usd(net)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', marginTop: '18px' }}>
              {legend.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-2,#6b6b78)', whiteSpace: 'nowrap' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: l.color, flex: 'none' }} />
                    {l.label}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: l.color, whiteSpace: 'nowrap', flex: 'none' }}>{l.valStr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECONDARY STATS */}
      <div data-enter style={{ order: dord.stats, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '14px' }}>
        {statTiles.map((s, i) => (
          <div
            key={i}
            style={{ ...cardBase, borderRadius: '14px', padding: '15px 16px', transition: 'box-shadow .2s,border-color .2s' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 5px 18px rgba(16,16,20,0.08)'
              e.currentTarget.style.borderColor = 'var(--border-strong,#e0e0e6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow)'
              e.currentTarget.style.borderColor = 'var(--border,#ececef)'
            }}
          >
            <div style={{ fontSize: '11px', color: 'var(--text-2,#6b6b78)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {s.label}
              <InfoTip text={s.tip} size={12} />
            </div>
            <div style={{ fontSize: '20px', fontWeight: 600, letterSpacing: '-0.01em', marginTop: '7px', color: s.color, fontVariantNumeric: 'tabular-nums' }}>{s.value}</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{s.hint}</div>
          </div>
        ))}
      </div>

      {/* COHORT RETENTION */}
      <div style={{ order: dord.cohort }}>
        <CohortGrid />
      </div>
    </div>
  )
}
