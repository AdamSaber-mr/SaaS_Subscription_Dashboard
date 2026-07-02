import { useState } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'
import { api } from '../lib/api.js'

const card = {
  background: 'var(--surface,#fff)',
  border: '1px solid var(--border,#ececef)',
  borderRadius: '16px',
  padding: '22px',
  boxShadow: 'var(--shadow)',
}
const field = {
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

function SectionCard({ title, sub, children, onSubmit, busy, done, error, buttonLabel, busyLabel }) {
  return (
    <form data-enter onSubmit={onSubmit} style={card}>
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>{title}</div>
      <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{sub}</div>
      {children}
      {error && (
        <div role="alert" style={{ fontSize: '12.5px', color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '9px 12px', marginTop: '14px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
        <button
          type="submit"
          disabled={busy}
          style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: 'var(--accent,#6E56CF)', color: '#fff', fontSize: '12.5px', fontWeight: 550, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}
        >
          {busy ? busyLabel : buttonLabel}
        </button>
        {done && <span style={{ fontSize: '12.5px', fontWeight: 550, color: 'var(--pos,#1f9d5b)' }}>{done}</span>}
      </div>
    </form>
  )
}

// One small state machine per form: busy → saved ✓ (fades) or error.
function useForm(action) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      await action()
      setDone(true)
      setTimeout(() => setDone(false), 3500)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }
  return { busy, done, error, submit }
}

export default function Settings() {
  const { user, updateUser, t } = useDashboard()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [company, setCompany] = useState(user?.team?.name || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const profile = useForm(async () => {
    updateUser(await api.patch('/settings/profile', { name, email }))
  })
  const team = useForm(async () => {
    updateUser(await api.patch('/settings/team', { name: company }))
  })
  const password = useForm(async () => {
    await api.put('/settings/password', { current_password: currentPw, password: newPw, password_confirmation: confirmPw })
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
  })

  return (
    <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionCard
        title={t('settings.profileTitle')}
        sub={t('settings.profileSub')}
        onSubmit={profile.submit}
        busy={profile.busy}
        done={profile.done && t('settings.saved')}
        error={profile.error}
        buttonLabel={t('settings.save')}
        busyLabel={t('settings.saving')}
      >
        <label style={labelStyle} htmlFor="set-name">{t('settings.name')}</label>
        <input id="set-name" required value={name} onChange={(e) => setName(e.target.value)} style={field} />
        <label style={labelStyle} htmlFor="set-email">{t('settings.email')}</label>
        <input id="set-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={field} />
      </SectionCard>

      <SectionCard
        title={t('settings.companyTitle')}
        sub={t('settings.companySub')}
        onSubmit={team.submit}
        busy={team.busy}
        done={team.done && t('settings.saved')}
        error={team.error}
        buttonLabel={t('settings.save')}
        busyLabel={t('settings.saving')}
      >
        <label style={labelStyle} htmlFor="set-company">{t('settings.company')}</label>
        <input id="set-company" required value={company} onChange={(e) => setCompany(e.target.value)} style={field} />
      </SectionCard>

      <SectionCard
        title={t('settings.passwordTitle')}
        sub={t('settings.passwordSub')}
        onSubmit={password.submit}
        busy={password.busy}
        done={password.done && t('settings.passwordChanged')}
        error={password.error}
        buttonLabel={t('settings.changePassword')}
        busyLabel={t('settings.saving')}
      >
        <label style={labelStyle} htmlFor="set-current">{t('settings.currentPassword')}</label>
        <input id="set-current" type="password" required autoComplete="current-password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} style={field} />
        <label style={labelStyle} htmlFor="set-new">{t('settings.newPassword')}</label>
        <input id="set-new" type="password" required minLength={8} autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={field} />
        <label style={labelStyle} htmlFor="set-confirm">{t('settings.confirmPassword')}</label>
        <input id="set-confirm" type="password" required minLength={8} autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} style={field} />
      </SectionCard>
    </div>
  )
}
