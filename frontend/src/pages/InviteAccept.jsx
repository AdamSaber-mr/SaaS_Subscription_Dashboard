import { useEffect, useState } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'
import { api, setToken } from '../lib/api.js'
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

/** Landing page for an invite link: /invite?token=… — join the team directly. */
export default function InviteAccept({ onAccepted }) {
  const { t } = useDashboard()
  const token = new URLSearchParams(window.location.search).get('token') || ''

  const [invite, setInvite] = useState(null) // {team, email}
  const [invalid, setInvalid] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get('/invitations/' + token)
      .then(setInvite)
      .catch(() => setInvalid(true))
  }, [token])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await api.post('/invitations/' + token + '/accept', { name, password })
      setToken(res.token)
      onAccepted(res.user)
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
        {invalid ? (
          <div role="alert" style={{ fontSize: '13px', lineHeight: 1.5, color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '10px 12px' }}>
            {t('login.inviteInvalid')}
          </div>
        ) : !invite ? (
          <div style={{ fontSize: '13px', color: 'var(--text-3,#9a9aa6)' }}>…</div>
        ) : (
          <>
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text,#15151b)' }}>{t('login.inviteTitle', { team: invite.team })}</div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-2,#6b6b78)', margin: '6px 0 18px', lineHeight: 1.5 }}>
              {t('login.inviteIntro')}
              <br />
              <span style={{ color: 'var(--text-3,#9a9aa6)' }}>{invite.email}</span>
            </div>

            <label style={labelStyle} htmlFor="invite-name">{t('login.name')}</label>
            <input id="invite-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} style={{ ...field, marginBottom: '14px' }} />
            <label style={labelStyle} htmlFor="invite-password">{t('login.password')}</label>
            <input id="invite-password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...field, marginBottom: '18px' }} />

            {error && (
              <div role="alert" style={{ fontSize: '12.5px', color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '9px 12px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} style={{ width: '100%', padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--accent,#6E56CF)', color: '#fff', fontSize: '13.5px', fontWeight: 550, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
              {busy ? t('modal.working') : t('login.inviteAccept')}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
