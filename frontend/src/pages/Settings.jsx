import { useEffect, useState } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'
import { api } from '../lib/api.js'
import { apiErrorText } from '../lib/i18n.js'
import { initial, avatarStyle, fmtDate } from '../lib/format.js'

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
function useForm(action, t) {
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
      setError(apiErrorText(err, t))
    } finally {
      setBusy(false)
    }
  }
  return { busy, done, error, submit }
}

/** Team members list + invite form + pending invitations with copyable links. */
function TeamMembers({ user, lang, t }) {
  const [data, setData] = useState(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [lastInvite, setLastInvite] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const load = () => api.get('/team/members').then(setData).catch(() => {})
  useEffect(() => {
    load()
  }, [])

  const invite = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const inv = await api.post('/team/invitations', { email: inviteEmail })
      setLastInvite(inv)
      setInviteEmail('')
      load()
    } catch (err) {
      setError(apiErrorText(err, t))
    } finally {
      setBusy(false)
    }
  }

  const copy = async (inv) => {
    try {
      await navigator.clipboard.writeText(inv.url)
    } catch {
      // clipboard may be unavailable; the link is still visible in the field
    }
    setCopiedId(inv.id)
    setTimeout(() => setCopiedId(null), 2500)
  }

  const revoke = async (id) => {
    await api.del('/team/invitations/' + id).catch(() => {})
    if (lastInvite?.id === id) setLastInvite(null)
    load()
  }

  return (
    <div data-enter style={card}>
      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text,#15151b)' }}>{t('settings.teamMembersTitle')}</div>
      <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{t('settings.teamMembersSub')}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '16px 0' }}>
        {(data?.members || []).map((m) => (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={avatarStyle(m.name, 30)}>{initial(m.name)}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '12.5px', fontWeight: 550, color: 'var(--text,#15151b)' }}>
                {m.name}
                {m.id === user?.id && (
                  <span style={{ marginLeft: '7px', fontSize: '10px', fontWeight: 600, padding: '2px 7px', borderRadius: '20px', color: 'var(--accent)', background: 'var(--accent-weak)' }}>{t('settings.you')}</span>
                )}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)' }}>{m.email}</div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={invite} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="email"
          required
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder={t('settings.inviteEmail')}
          aria-label={t('settings.inviteEmail')}
          style={{ ...field, flex: 1 }}
        />
        <button type="submit" disabled={busy} style={{ padding: '9px 16px', borderRadius: '10px', border: 'none', background: 'var(--accent,#6E56CF)', color: '#fff', fontSize: '12.5px', fontWeight: 550, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1, whiteSpace: 'nowrap' }}>
          {busy ? t('settings.saving') : t('settings.invite')}
        </button>
      </form>
      {error && (
        <div role="alert" style={{ fontSize: '12.5px', color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '9px 12px', marginTop: '12px' }}>
          {error}
        </div>
      )}
      {lastInvite && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 550, color: 'var(--pos,#1f9d5b)', marginBottom: '6px' }}>{t('settings.invited')}</div>
          <input readOnly value={lastInvite.url} onFocus={(e) => e.target.select()} aria-label="Invite link" style={{ ...field, fontSize: '11.5px' }} />
        </div>
      )}

      {(data?.invitations || []).length > 0 && (
        <div style={{ marginTop: '18px' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--text-3,#9a9aa6)', marginBottom: '8px' }}>{t('settings.pending')}</div>
          {(data?.invitations || []).map((inv) => (
            <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 0', borderTop: '1px solid var(--border,#ececef)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--text,#15151b)' }}>{inv.email}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)' }}>{t('settings.expires', { date: fmtDate(inv.expiresAt, lang) })}</div>
              </div>
              <button onClick={() => copy(inv)} style={{ padding: '5px 11px', borderRadius: '8px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--accent,#6E56CF)', fontSize: '11.5px', fontWeight: 550, cursor: 'pointer' }}>
                {copiedId === inv.id ? t('settings.copied') : t('settings.copyLink')}
              </button>
              <button onClick={() => revoke(inv.id)} style={{ padding: '5px 11px', borderRadius: '8px', border: '1px solid var(--border-strong,#e0e0e6)', background: 'var(--surface,#fff)', color: 'var(--neg,#e5484d)', fontSize: '11.5px', fontWeight: 550, cursor: 'pointer' }}>
                {t('settings.revoke')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const { user, updateUser, lang, t } = useDashboard()

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [company, setCompany] = useState(user?.team?.name || '')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')

  const profile = useForm(async () => {
    updateUser(await api.patch('/settings/profile', { name, email }))
  }, t)
  const team = useForm(async () => {
    updateUser(await api.patch('/settings/team', { name: company }))
  }, t)
  const password = useForm(async () => {
    await api.put('/settings/password', { current_password: currentPw, password: newPw, password_confirmation: confirmPw })
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
  }, t)

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

      <TeamMembers user={user} lang={lang} t={t} />

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
