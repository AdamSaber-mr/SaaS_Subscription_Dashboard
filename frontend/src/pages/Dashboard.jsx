import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { periodLabel } from '../lib/periods.js'
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
  const { metrics, period, movementViz, setMovementViz, dashLayout, setDashLayout } = useDashboard()
  const M = usePeriodMetrics()
  const { newM, expM, conM, chuM, endMRR, endActive, newCust, net, nrr, quick, arpu, ltv, custChurn, revChurn } = M
  const T = metrics.trend

  const mrrDelta = delta(endMRR, M.startMRR)
  const custDelta = delta(endActive, M.startActive)
  const animDeps = [period, metrics]

  const kpis = [
    { key: 'mrr', label: 'MRR', tip: 'Monthly Recurring Revenue — the steady income you collect every month from all active subscriptions.', value: Math.round(endMRR), format: (x) => usd(x), deltaStr: mrrDelta.str, deltaPos: mrrDelta.pos, sub: 'Monthly recurring revenue', valueColor: 'var(--text)', spark: spark(T.mrr.slice(-12)) },
    { key: 'arr', label: 'ARR', tip: 'Annual Run-Rate — your current monthly revenue projected across a full year (MRR × 12).', value: Math.round(endMRR * 12), format: (x) => usd(x), deltaStr: mrrDelta.str, deltaPos: mrrDelta.pos, sub: 'Annual run-rate', valueColor: 'var(--text)', spark: spark(T.mrr.slice(-12).map((x) => x * 12)) },
    { key: 'cust', label: 'Active customers', tip: 'The number of customers with a paid, active subscription right now.', value: endActive, format: (x) => Math.round(x).toLocaleString('en-US'), deltaStr: custDelta.str, deltaPos: custDelta.pos, sub: newCust + ' new this period', valueColor: 'var(--text)', spark: spark(T.activeCustomers.slice(-12)) },
    { key: 'net', label: 'Net new MRR', tip: 'How much your monthly revenue grew or shrank this period: new + upgrades − downgrades − cancellations.', value: Math.round(net), format: (x) => (x >= 0 ? '+' : '') + usd(x), deltaStr: periodLabel(period), deltaNeutral: true, sub: 'New + expansion − churn', valueColor: net >= 0 ? 'var(--pos)' : 'var(--neg)', spark: spark(T.newM.slice(-12).map((x, i) => x + T.expM.slice(-12)[i] - T.conM.slice(-12)[i] - T.chuM.slice(-12)[i])) },
  ]

  const statTiles = [
    { label: 'Net revenue retention', value: pct1(nrr), color: nrr >= 1 ? 'var(--pos)' : 'var(--neg)', hint: nrr >= 1 ? 'Expanding base' : 'Contracting base', tip: 'Of the revenue you had at the start, how much you kept and grew — counting upgrades, losing cancellations. Above 100% means existing customers spend more over time.' },
    { label: 'Quick ratio', value: quick === null ? '∞' : quick.toFixed(1), color: quick === null || quick >= 4 ? 'var(--pos)' : 'var(--text)', hint: '(New+Exp) / (Contr+Churn)', tip: 'Growth efficiency: revenue gained (new + upgrades) divided by revenue lost (downgrades + cancellations). Higher is healthier; above 4 is strong. ∞ means nothing was lost this period.' },
    { label: 'ARPU', value: usd(arpu), color: 'var(--text)', hint: 'Per active customer', tip: 'Average Revenue Per User — total monthly revenue divided by your active customers.' },
    { label: 'LTV', value: usd(ltv), color: 'var(--text)', hint: 'ARPU ÷ monthly churn', tip: 'Lifetime Value — the estimated total revenue from a customer before they cancel (ARPU ÷ monthly churn rate).' },
    { label: 'Customer churn', value: pct1(custChurn), color: 'var(--neg)', hint: 'avg / month', tip: 'The share of customers who cancel each month, on average. Lower is better.' },
    { label: 'Revenue churn', value: pct1(revChurn), color: revChurn < 0 ? 'var(--pos)' : 'var(--neg)', hint: 'avg / month', tip: 'The share of monthly revenue lost to cancellations each month, on average. Lower is better.' },
  ]

  // MRR movements
  const m = { newM, expM, conM, chuM }
  const bmax = Math.max(newM, expM, conM, chuM) || 1
  const bridge = [
    { label: 'New customers', v: newM, color: 'var(--pos)', sign: '+' },
    { label: 'Upgrades', v: expM, color: 'var(--pos)', sign: '+' },
    { label: 'Downgrades', v: conM, color: 'var(--neg)', sign: '−' },
    { label: 'Cancellations', v: chuM, color: 'var(--neg)', sign: '−' },
  ]
  const legend = [
    { label: 'New customers', color: 'var(--pos)', valStr: '+' + usd(newM) },
    { label: 'Upgrades', color: 'var(--pos)', valStr: '+' + usd(expM) },
    { label: 'Downgrades', color: 'var(--neg)', valStr: '−' + usd(conM) },
    { label: 'Cancellations', color: 'var(--neg)', valStr: '−' + usd(chuM) },
  ]

  // layout variation order
  const analyst = dashLayout === 'analyst'
  const dord = analyst ? { kpis: 1, stats: 2, mov: 3, charts: 4, cohort: 5 } : { kpis: 1, charts: 2, mov: 3, stats: 4, cohort: 5 }

  const last = T.mrr.length - 1
  const trendGrowth = '+' + usd(T.mrr[last] - T.mrr[Math.max(0, last - 12)]) + ' / yr'
  const custGrowth = '+' + (T.activeCustomers[last] - T.activeCustomers[Math.max(0, last - 12)]) + ' / yr'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div data-enter style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', order: 0 }}>
        <span style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', fontWeight: 500 }}>Layout</span>
        <SegToggle
          options={[
            ['spacious', 'Revenue-first'],
            ['analyst', 'Metrics-first'],
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
      <div data-enter style={{ order: dord.charts, display: 'grid', gridTemplateColumns: analyst ? '1fr 1fr' : '1.6fr 1fr', gap: '16px' }}>
        <ChartCard
          title="Monthly recurring revenue"
          tip="Your total monthly recurring revenue over the last 18 months. The shaded band marks the period you picked at the top."
          subtitle="Last 18 months · selected period shaded"
          endLabel={usd(endMRR)}
          growthLabel={trendGrowth}
        >
          <MrrTrendChart />
        </ChartCard>
        <ChartCard
          title="Active customers"
          tip="How many paying customers you had at the end of each month, after subtracting anyone who cancelled."
          subtitle="Net of churn"
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
              MRR movements
              <InfoTip text="Where your monthly revenue grew and shrank this period. Green bars add revenue (new customers, upgrades); red bars remove it (downgrades, cancellations)." />
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>How recurring revenue changed over {periodLabel(period)}</div>
          </div>
          <SegToggle
            options={[
              ['bars', 'Chart'],
              ['flow', 'Flow'],
              ['bridge', 'Breakdown'],
            ]}
            value={movementViz}
            onChange={setMovementViz}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: '28px', alignItems: 'center' }}>
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

          <div style={{ borderLeft: '1px solid var(--border,#ececef)', paddingLeft: '26px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-2,#6b6b78)', fontWeight: 500 }}>Net MRR change</div>
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
