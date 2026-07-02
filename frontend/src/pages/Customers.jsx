import { useRef, useState } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { usd, initial, avatarStyle, fmtMonth } from '../lib/format.js'
import { planBadge, statusStyle } from '../lib/badges.js'
import { api } from '../lib/api.js'
import { apiErrorText } from '../lib/i18n.js'
import StatCard from '../components/StatCard.jsx'
import { DialogShell } from '../components/Modal.jsx'

const GRID = '2.2fr 1.3fr 1fr 1fr 1fr 1.1fr'

const TEMPLATE_CSV =
  'name,email,plan,country,started_at,status,canceled_at\n' +
  'Acme BV,billing@acme.nl,growth,Netherlands,2026-01-15,active,\n' +
  'Oud Klant BV,oud@klant.nl,starter,Belgium,2025-08-01,canceled,2026-03-01\n'

/** CSV import dialog: template download, upload, per-row error report. */
function ImportModal({ onClose, onImported, t }) {
  const fileRef = useRef(null)
  const [fileName, setFileName] = useState(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // {imported} | {rows} | {message}

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'klanten-import.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const run = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setBusy(true)
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.upload('/import/customers', fd)
      setResult({ imported: res.imported })
      onImported()
    } catch (err) {
      setResult(err.rows ? { rows: err.rows } : { message: apiErrorText(err, t) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <DialogShell onClose={onClose}>
      <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--border,#ececef)' }}>
        <div id="modal-title" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text,#15151b)' }}>{t('import.title')}</div>
      </div>
      <div style={{ padding: '18px 22px' }}>
        <div style={{ fontSize: '12.5px', lineHeight: 1.55, color: 'var(--text-2,#6b6b78)' }}>{t('import.intro')}</div>
        <button onClick={downloadTemplate} style={{ marginTop: '10px', padding: '7px 12px', borderRadius: '9px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--accent,#6E56CF)', fontSize: '12px', fontWeight: 550, cursor: 'pointer' }}>
          ⬇ {t('import.template')}
        </button>

        <label
          htmlFor="import-file"
          style={{ display: 'block', marginTop: '16px', padding: '18px', borderRadius: '12px', border: '2px dashed var(--border-strong,#e0e0e6)', textAlign: 'center', fontSize: '12.5px', color: fileName ? 'var(--text,#15151b)' : 'var(--text-3,#9a9aa6)', cursor: 'pointer', fontWeight: fileName ? 550 : 450 }}
        >
          {fileName || t('import.choose')}
        </label>
        <input id="import-file" ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => setFileName(e.target.files?.[0]?.name || null)} style={{ display: 'none' }} />

        {result?.imported != null && (
          <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 600, color: 'var(--pos,#1f9d5b)' }}>{t('import.success', { n: result.imported })}</div>
        )}
        {result?.message && (
          <div role="alert" style={{ marginTop: '14px', fontSize: '12.5px', color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '9px 12px' }}>
            {result.message}
          </div>
        )}
        {result?.rows && (
          <div role="alert" style={{ marginTop: '14px', fontSize: '12.5px', color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '10px 12px', maxHeight: '160px', overflowY: 'auto' }}>
            <div style={{ fontWeight: 600, marginBottom: '6px' }}>{t('import.failed')}</div>
            {Object.entries(result.rows).map(([row, reason]) => (
              <div key={row}>
                {t('import.row', { n: row })}: {t('import.reasons.' + reason)}
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '0 22px 20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          {t('modal.close')}
        </button>
        <button onClick={run} disabled={busy || !fileName} style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: 'var(--accent,#6E56CF)', color: '#fff', fontSize: '13px', fontWeight: 550, cursor: busy || !fileName ? 'default' : 'pointer', opacity: busy || !fileName ? 0.6 : 1 }}>
          {busy ? t('modal.working') : t('import.run')}
        </button>
      </div>
    </DialogShell>
  )
}

export default function Customers() {
  const {
    customerList, metrics, planRamp, maxPlanMrr, period, lang, t,
    search, setSearch, statusFilter, setStatusFilter,
    sortKey, sortDir, toggleSort, page, setPage, openCustomer, refresh,
  } = useDashboard()
  const { newCust, endActive, endMRR } = usePeriodMetrics()
  const [importOpen, setImportOpen] = useState(false)

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setImportOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 13px', borderRadius: '9px', border: '1px solid var(--accent,#6E56CF)', background: 'var(--accent-weak,#f0edfb)', color: 'var(--accent,#6E56CF)', fontSize: '12px', fontWeight: 550, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            {t('import.button')}
          </button>
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

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onImported={refresh} t={t} />}
    </div>
  )
}
