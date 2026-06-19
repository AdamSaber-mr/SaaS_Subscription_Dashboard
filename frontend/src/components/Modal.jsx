import { useDashboard } from '../store/DashboardContext.jsx'
import { PLANS, plan } from '../lib/engine.js'
import { usd } from '../lib/format.js'

function PlanOption({ p, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '11px 13px',
        borderRadius: '11px',
        cursor: 'pointer',
        textAlign: 'left',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
        background: active ? 'var(--accent-weak)' : 'var(--surface-2)',
        color: 'var(--text)',
      }}
    >
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
        <span style={{ fontSize: '13px', fontWeight: 550 }}>{p.name}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)' }}>
          {p.interval === 'year' ? '$11,988/yr · $999 MRR' : '$' + p.price + '/mo'}
        </span>
      </span>
      <span
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: `5px solid ${active ? 'var(--accent)' : 'var(--border-strong)'}`,
          background: active ? 'var(--accent)' : 'transparent',
          boxSizing: 'border-box',
        }}
      />
    </button>
  )
}

export default function Modal() {
  const {
    modal, modalForm, setModalForm, customers,
    closeModal, doChangePlan, doCancel, doNewSub,
  } = useDashboard()

  if (!modal) return null

  const target = modal.id ? customers.find((c) => c.id === modal.id) : null
  const selectPlan = (pid) => setModalForm((f) => ({ ...f, planId: pid }))

  let title = '',
    sub = '',
    body = null
  let confirmLabel = '',
    confirmBg = 'var(--accent)',
    onConfirm = closeModal

  const planList = (
    <div>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2,#6b6b78)', display: 'block', marginBottom: '8px' }}>
        {modal.kind === 'change' ? 'Select a new plan' : 'Choose a plan'}
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {PLANS.map((p) => (
          <PlanOption key={p.id} p={p} active={modalForm.planId === p.id} onClick={() => selectPlan(p.id)} />
        ))}
      </div>
    </div>
  )

  if (modal.kind === 'change') {
    title = 'Change plan'
    sub = target ? target.name : ''
    confirmLabel = 'Update plan'
    onConfirm = () => doChangePlan(modal.id, modalForm.planId)
    body = planList
  } else if (modal.kind === 'cancel') {
    title = 'Cancel subscription'
    sub = target ? target.name : ''
    confirmLabel = 'Confirm cancellation'
    confirmBg = 'var(--neg)'
    onConfirm = () => doCancel(modal.id)
    body = (
      <div style={{ fontSize: '13px', color: 'var(--text-2,#6b6b78)', lineHeight: 1.5 }}>
        {'This will cancel ' +
          (target ? target.name : 'this customer') +
          '’s subscription effective this month. Their ' +
          usd(target ? plan(target.planId).mrr : 0) +
          ' MRR will move to churned, lowering net new MRR for the current period.'}
      </div>
    )
  } else {
    title = 'New subscription'
    sub = 'Add a customer and start billing'
    confirmLabel = 'Create subscription'
    onConfirm = doNewSub
    body = (
      <>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2,#6b6b78)', display: 'block', marginBottom: '6px' }}>Company name</label>
          <input
            value={modalForm.name}
            onChange={(e) => setModalForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Acme Inc."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border,#ececef)',
              background: 'var(--surface-2,#f6f6f8)',
              color: 'var(--text,#15151b)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>
        {planList}
      </>
    )
  }

  return (
    <div
      onClick={closeModal}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(8,8,12,0.4)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'var(--surface,#fff)',
          border: '1px solid var(--border,#ececef)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(8,8,12,0.28)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--border,#ececef)' }}>
          <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text,#15151b)' }}>{title}</div>
          <div style={{ fontSize: '12.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{sub}</div>
        </div>
        <div style={{ padding: '20px 22px' }}>{body}</div>
        <div style={{ padding: '14px 22px 20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={closeModal}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid var(--border-strong,#e0e0e6)',
              background: 'var(--surface,#fff)',
              color: 'var(--text,#15151b)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: confirmBg,
              color: '#fff',
              fontSize: '13px',
              fontWeight: 550,
              cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
