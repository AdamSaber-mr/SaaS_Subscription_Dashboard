import { useState } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'
import { usePeriodMetrics } from '../hooks/usePeriodMetrics.js'
import { usd, pct1, hexA } from '../lib/format.js'
import { api } from '../lib/api.js'
import { apiErrorText } from '../lib/i18n.js'
import { DialogShell } from '../components/Modal.jsx'

const card = {
  background: 'var(--surface,#fff)',
  border: '1px solid var(--border,#ececef)',
  borderRadius: '16px',
  boxShadow: 'var(--shadow)',
}
const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '10px',
  border: '1px solid var(--border,#ececef)',
  background: 'var(--surface-2,#f6f6f8)',
  color: 'var(--text,#15151b)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
}
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-2,#6b6b78)', margin: '12px 0 6px' }
const iconBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '26px',
  height: '26px',
  borderRadius: '7px',
  border: '1px solid var(--border,#ececef)',
  background: 'var(--surface,#fff)',
  color: 'var(--text-2,#6b6b78)',
  cursor: 'pointer',
  flex: 'none',
}

/** Create/edit dialog for a plan tier. */
function PlanFormModal({ plan, onClose, onSaved, t }) {
  const [name, setName] = useState(plan?.name || '')
  const [blurb, setBlurb] = useState(plan?.blurb || '')
  const [price, setPrice] = useState(plan ? String(plan.price) : '')
  const [interval, setInterval_] = useState(plan?.interval || 'month')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const body = { name, blurb: blurb || null, price: Number(price), interval }
      if (plan) await api.patch('/plans/' + plan.planId, body)
      else await api.post('/plans', body)
      onSaved()
    } catch (err) {
      setError(apiErrorText(err, t))
      setBusy(false)
    }
  }

  return (
    <DialogShell onClose={onClose}>
      <form onSubmit={submit}>
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--border,#ececef)' }}>
          <div id="modal-title" style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text,#15151b)' }}>
            {plan ? t('plans.editPlan') : t('plans.newPlan')}
          </div>
        </div>
        <div style={{ padding: '8px 22px 20px' }}>
          <label style={labelStyle} htmlFor="plan-name">{t('plans.planName')}</label>
          <input id="plan-name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />
          <label style={labelStyle} htmlFor="plan-blurb">{t('plans.planBlurb')}</label>
          <input id="plan-blurb" maxLength={160} value={blurb} onChange={(e) => setBlurb(e.target.value)} style={fieldStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '10px' }}>
            <div>
              <label style={labelStyle} htmlFor="plan-price">{t('plans.planPrice')}</label>
              <input id="plan-price" type="number" min="0" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="plan-interval">{t('plans.intervalLabel')}</label>
              <select id="plan-interval" value={interval} onChange={(e) => setInterval_(e.target.value)} style={{ ...fieldStyle, cursor: 'pointer' }}>
                <option value="month">{t('plans.monthly')}</option>
                <option value="year">{t('plans.yearly')}</option>
              </select>
            </div>
          </div>
          {error && (
            <div role="alert" style={{ fontSize: '12.5px', color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '9px 12px', marginTop: '14px' }}>
              {error}
            </div>
          )}
        </div>
        <div style={{ padding: '0 22px 20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
            {t('modal.close')}
          </button>
          <button type="submit" disabled={busy} style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: 'var(--accent,#6E56CF)', color: '#fff', fontSize: '13px', fontWeight: 550, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
            {busy ? t('modal.working') : plan ? t('plans.savePlan') : t('plans.createPlan')}
          </button>
        </div>
      </form>
    </DialogShell>
  )
}

/** Confirm-delete dialog; explains when a plan is still referenced. */
function DeletePlanModal({ plan, onClose, onDeleted, t }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const doDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      await api.del('/plans/' + plan.planId)
      onDeleted()
    } catch (err) {
      setError(apiErrorText(err, t))
      setBusy(false)
    }
  }

  return (
    <DialogShell onClose={onClose}>
      <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--border,#ececef)' }}>
        <div id="modal-title" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text,#15151b)' }}>{t('plans.deleteTitle')}</div>
      </div>
      <div style={{ padding: '18px 22px', fontSize: '13px', color: 'var(--text-2,#6b6b78)', lineHeight: 1.5 }}>
        {t('plans.deleteBody', { plan: plan.name })}
        {error && (
          <div role="alert" style={{ fontSize: '12.5px', color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '9px 12px', marginTop: '12px' }}>
            {error}
          </div>
        )}
      </div>
      <div style={{ padding: '0 22px 20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: '10px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
          {t('modal.close')}
        </button>
        <button onClick={doDelete} disabled={busy} style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: 'var(--neg,#e5484d)', color: '#fff', fontSize: '13px', fontWeight: 550, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
          {busy ? t('modal.working') : t('plans.deleteConfirm')}
        </button>
      </div>
    </DialogShell>
  )
}

export default function Plans() {
  const { plans, planRamp, metrics, t, refresh } = useDashboard()
  const { endMRR: totalMRR, endActive } = usePeriodMetrics()
  const [dialog, setDialog] = useState(null) // {kind:'new'} | {kind:'edit',plan} | {kind:'delete',plan}

  const closeAnd = (didChange) => {
    setDialog(null)
    if (didChange) refresh()
  }

  const mix = Object.fromEntries(metrics.planMix.map((p) => [p.id, p]))
  const counts = plans.map((p) => mix[p.id]?.customers ?? 0)
  const popIdx = counts.indexOf(Math.max(...counts))

  const rows = plans.map((p, pi) => {
    const cnt = counts[pi]
    const mrr = mix[p.id]?.mrr ?? 0
    return {
      id: p.id,
      raw: p, // the API object (incl. planId) for the edit/delete dialogs
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
      {/* MANAGE BAR */}
      <div data-enter style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setDialog({ kind: 'new' })}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 14px', borderRadius: '10px', border: 'none', background: 'var(--accent,#6E56CF)', color: '#fff', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer', boxShadow: '0 1px 2px rgba(110,86,207,0.3)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('plans.newPlan')}
        </button>
      </div>

      {/* PLAN CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(215px,1fr))', gap: '16px' }}>
        {rows.map((p) => (
          <div key={p.id} data-enter style={{ ...card, borderTop: `3px solid ${p.ramp}`, padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 'none' }}>
                {p.pop && (
                  <span style={{ fontSize: '9.5px', fontWeight: 650, letterSpacing: '.04em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: '20px', color: p.ramp, background: hexA(p.ramp, 0.14), whiteSpace: 'nowrap' }}>
                    {t('plans.popular')}
                  </span>
                )}
                <button aria-label={t('plans.editAria', { plan: p.name })} onClick={() => setDialog({ kind: 'edit', plan: p.raw })} style={iconBtn}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                  </svg>
                </button>
                <button aria-label={t('plans.deleteAria', { plan: p.name })} onClick={() => setDialog({ kind: 'delete', plan: p.raw })} style={{ ...iconBtn, color: 'var(--neg,#e5484d)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </svg>
                </button>
              </div>
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
        <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: '480px' }}>
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

      {dialog?.kind === 'new' && <PlanFormModal plan={null} onClose={() => closeAnd(false)} onSaved={() => closeAnd(true)} t={t} />}
      {dialog?.kind === 'edit' && <PlanFormModal plan={dialog.plan} onClose={() => closeAnd(false)} onSaved={() => closeAnd(true)} t={t} />}
      {dialog?.kind === 'delete' && <DeletePlanModal plan={dialog.plan} onClose={() => closeAnd(false)} onDeleted={() => closeAnd(true)} t={t} />}
    </div>
  )
}
