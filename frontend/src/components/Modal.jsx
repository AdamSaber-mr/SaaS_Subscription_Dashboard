import { useEffect, useRef } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'
import { usd } from '../lib/format.js'

// Accessible dialog shell: focus moves in on open, is trapped while open
// (Tab cycles), Escape closes, and focus returns to the opener on close.
function DialogShell({ onClose, children }) {
  const boxRef = useRef(null)

  useEffect(() => {
    const opener = document.activeElement
    const box = boxRef.current
    const focusables = () =>
      [...box.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.disabled)
    focusables()[0]?.focus()

    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const els = focusables()
      if (!els.length) return
      const first = els[0]
      const last = els[els.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus?.()
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
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
        ref={boxRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
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
        {children}
      </div>
    </div>
  )
}

function PlanOption({ p, active, onClick, t }) {
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
          {p.interval === 'year'
            ? t('modal.yrPrice', { price: '$' + p.price.toLocaleString('en-US'), mrr: '$' + p.mrr.toLocaleString('en-US') })
            : t('modal.moPrice', { price: '$' + p.price })}
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
    modal, modalForm, setModalForm, plans, actionBusy,
    closeModal, doChangePlan, doCancel, doNewSub, t,
  } = useDashboard()

  if (!modal) return null

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
        {modal.kind === 'change' ? t('modal.selectNew') : t('modal.choose')}
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {plans.map((p) => (
          <PlanOption key={p.id} p={p} active={modalForm.planId === p.id} onClick={() => selectPlan(p.id)} t={t} />
        ))}
      </div>
    </div>
  )

  if (modal.kind === 'change') {
    title = t('modal.changeTitle')
    sub = modal.name || ''
    confirmLabel = t('modal.update')
    onConfirm = doChangePlan
    body = planList
  } else if (modal.kind === 'cancel') {
    title = t('modal.cancelTitle')
    sub = modal.name || ''
    confirmLabel = t('modal.confirmCancel')
    confirmBg = 'var(--neg)'
    onConfirm = doCancel
    body = (
      <div style={{ fontSize: '13px', color: 'var(--text-2,#6b6b78)', lineHeight: 1.5 }}>
        {t('modal.cancelBody', { name: modal.name || t('modal.thisCustomer'), mrr: usd(modal.mrr || 0) })}
      </div>
    )
  } else {
    title = t('modal.newTitle')
    sub = t('modal.newSub')
    confirmLabel = t('modal.create')
    onConfirm = doNewSub
    body = (
      <>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2,#6b6b78)', display: 'block', marginBottom: '6px' }}>{t('modal.companyName')}</label>
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
    <DialogShell onClose={closeModal}>
        <div style={{ padding: '20px 22px 14px', borderBottom: '1px solid var(--border,#ececef)' }}>
          <div id="modal-title" style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text,#15151b)' }}>{title}</div>
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
            {t('modal.close')}
          </button>
          <button
            onClick={onConfirm}
            disabled={actionBusy}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: confirmBg,
              color: '#fff',
              fontSize: '13px',
              fontWeight: 550,
              cursor: actionBusy ? 'default' : 'pointer',
              opacity: actionBusy ? 0.7 : 1,
            }}
          >
            {actionBusy ? t('modal.working') : confirmLabel}
          </button>
        </div>
    </DialogShell>
  )
}
