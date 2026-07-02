import { useDashboard } from '../../store/DashboardContext.jsx'
import { trMonths } from '../../lib/i18n.js'
import InfoTip from '../InfoTip.jsx'

// % of each sign-up cohort still active, by months since signup.
export default function CohortGrid() {
  const { metrics, lang, t } = useDashboard()
  const { labels, sizes, grid } = metrics.cohort
  const nCols = grid[0]?.length || 9
  const head = Array.from({ length: nCols }, (_, k) => (k === 0 ? t('cohort.size') : 'M' + k))

  const rows = grid.map((row, ri) => ({
    label: trMonths(labels[ri], lang),
    cells: row.map((p, k) => {
      if (p === null) return { label: '', empty: true }
      const size = sizes[ri]
      const txt = size ? (k === 0 ? String(size) : Math.round(p * 100) + '%') : '–'
      return { label: txt, p }
    }),
  }))

  const gridCols = `84px repeat(${nCols},1fr)`

  return (
    <div
      data-enter
      style={{
        background: 'var(--surface,#fff)',
        border: '1px solid var(--border,#ececef)',
        borderRadius: '16px',
        padding: '20px 22px',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>
          {t('cohort.title')}
          <InfoTip text={t('cohort.tip')} />
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{t('cohort.subtitle')}</div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: '560px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '4px', marginBottom: '4px' }}>
            <span style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)', fontWeight: 500 }}>{t('cohort.cohortCol')}</span>
            {head.map((h, i) => (
              <span key={i} style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)', textAlign: 'center', fontWeight: 500 }}>{h}</span>
            ))}
          </div>
          {rows.map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '4px', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-2,#6b6b78)', display: 'flex', alignItems: 'center', fontVariantNumeric: 'tabular-nums' }}>{row.label}</span>
              {row.cells.map((c, ci) =>
                c.empty ? (
                  <div key={ci} style={{ height: '30px', borderRadius: '5px', background: 'transparent' }} />
                ) : (
                  <div
                    key={ci}
                    style={{
                      height: '30px',
                      borderRadius: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums',
                      color: c.p > 0.55 ? '#fff' : 'var(--text-2)',
                      background: `color-mix(in oklab, var(--accent) ${Math.round(c.p * 86)}%, var(--surface-2))`,
                    }}
                  >
                    {c.label}
                  </div>
                ),
              )}
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)' }}>
            <span>{t('cohort.fewer')}</span>
            <div style={{ flex: 1, maxWidth: '200px', height: '8px', borderRadius: '5px', background: 'linear-gradient(90deg, var(--surface-2), var(--accent))' }} />
            <span>{t('cohort.more')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
