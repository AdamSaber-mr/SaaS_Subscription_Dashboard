import { useState } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'
import { api } from '../lib/api.js'
import { apiErrorText } from '../lib/i18n.js'

const field = {
  width: '100%',
  padding: '11px 13px',
  borderRadius: '10px',
  border: '1px solid var(--border,#ececef)',
  background: 'var(--surface-2,#f6f6f8)',
  color: 'var(--text,#15151b)',
  fontSize: '13.5px',
  outline: 'none',
  boxSizing: 'border-box',
}
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-2,#6b6b78)', marginBottom: '6px' }

/** Landing page for the emailed reset link: /reset-password?token=…&email=… */
export default function ResetPassword() {
  const { t } = useDashboard()
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token') || ''
  const email = params.get('email') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const backToLogin = () => {
    window.location.href = window.location.origin + import.meta.env.BASE_URL
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api.post('/reset-password', { token, email, password, password_confirmation: confirm })
      setDone(true)
    } catch (err) {
      setError(apiErrorText(err, t))
      setBusy(false)
    }
  }

  return (
    <div style={{ flex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg,#fbfbfc)', padding: '24px' }}>
      <form
        onSubmit={submit}
        data-enter
        style={{ width: '100%', maxWidth: '380px', background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '18px', padding: '30px 30px 26px', boxShadow: '0 18px 50px rgba(8,8,12,0.10)' }}
      >
        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text,#15151b)', marginBottom: '4px' }}>{t('login.resetTitle')}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-3,#9a9aa6)', marginBottom: '18px' }}>{email}</div>

        {done ? (
          <>
            <div role="status" style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--pos,#1f9d5b)', background: 'var(--pos-weak,#e8f6ee)', borderRadius: '9px', padding: '10px 12px' }}>
              {t('login.resetDone')}
            </div>
            <button type="button" onClick={backToLogin} style={{ width: '100%', marginTop: '16px', padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--accent,#6E56CF)', color: '#fff', fontSize: '13.5px', fontWeight: 550, cursor: 'pointer' }}>
              {t('login.backToLogin')}
            </button>
          </>
        ) : (
          <>
            <label style={labelStyle} htmlFor="reset-password">{t('settings.newPassword')}</label>
            <input id="reset-password" type="password" required minLength={8} autoFocus autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...field, marginBottom: '14px' }} />
            <label style={labelStyle} htmlFor="reset-confirm">{t('settings.confirmPassword')}</label>
            <input id="reset-confirm" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={{ ...field, marginBottom: '18px' }} />

            {error && (
              <div role="alert" style={{ fontSize: '12.5px', color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '9px 12px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--accent,#6E56CF)', color: '#fff', fontSize: '13.5px', fontWeight: 550, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
              {busy ? t('modal.working') : t('login.setPassword')}
            </button>
            <button type="button" onClick={backToLogin} style={{ width: '100%', marginTop: '12px', padding: '8px', border: 'none', background: 'none', color: 'var(--accent,#6E56CF)', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer' }}>
              {t('login.backToLogin')}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
