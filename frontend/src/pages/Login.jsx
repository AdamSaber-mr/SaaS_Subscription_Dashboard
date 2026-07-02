import { useEffect, useState } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'
import { api } from '../lib/api.js'

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

export default function Login() {
  const { login, register, demoLogin, t } = useDashboard()
  // The demo banner's CTA logs out and reopens this screen in register mode.
  // Reading is side-effect free (StrictMode runs initializers twice); the
  // flag is consumed in an effect.
  const [mode, setMode] = useState(() =>
    sessionStorage.getItem('revenue-os.openRegister') ? 'register' : 'login',
  ) // 'login' | 'register' | 'forgot'
  useEffect(() => {
    sessionStorage.removeItem('revenue-os.openRegister')
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [linkSent, setLinkSent] = useState(false)

  const isRegister = mode === 'register'
  const isForgot = mode === 'forgot'

  const switchMode = () => {
    setMode(isRegister || isForgot ? 'login' : 'register')
    setError(null)
    setLinkSent(false)
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (isForgot) {
        await api.post('/forgot-password', { email })
        setLinkSent(true)
        setBusy(false)
      } else if (isRegister) {
        await register({ name, company, email, password })
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err.message || 'Login failed')
      setBusy(false)
    }
  }

  return (
    <div style={{ flex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg,#fbfbfc)', padding: '24px' }}>
      <form
        onSubmit={submit}
        data-enter
        style={{
          width: '100%',
          maxWidth: '380px',
          background: 'var(--surface,#fff)',
          border: '1px solid var(--border,#ececef)',
          borderRadius: '18px',
          padding: '30px 30px 26px',
          boxShadow: '0 18px 50px rgba(8,8,12,0.10)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '22px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'var(--accent,#6E56CF)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l5-6 4 4 6-8" />
              <path d="M3 21h18" />
            </svg>
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text,#15151b)' }}>Revenue OS</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)' }}>{isRegister ? t('login.createAccount') : isForgot ? t('login.forgotTitle') : t('login.signIn')}</div>
          </div>
        </div>

        {isRegister && (
          <>
            <label style={labelStyle} htmlFor="login-name">
              {t('login.name')}
            </label>
            <input id="login-name" required autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Adam Saber" style={{ ...field, marginBottom: '14px' }} />

            <label style={labelStyle} htmlFor="login-company">
              {t('login.company')}
            </label>
            <input id="login-company" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme BV" style={{ ...field, marginBottom: '14px' }} />
          </>
        )}

        {isForgot && (
          <div style={{ fontSize: '12.5px', lineHeight: 1.5, color: 'var(--text-2,#6b6b78)', marginBottom: '14px' }}>{t('login.forgotIntro')}</div>
        )}

        <label style={labelStyle} htmlFor="login-email">
          {t('login.email')}
        </label>
        <input id="login-email" type="email" required autoFocus={!isRegister} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={{ ...field, marginBottom: '14px' }} />

        {!isForgot && (
          <>
            <label style={labelStyle} htmlFor="login-password">
              {t('login.password')}
            </label>
            <input id="login-password" type="password" required minLength={isRegister ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...field, marginBottom: '6px' }} />
          </>
        )}
        {!isRegister && !isForgot && (
          <button
            type="button"
            onClick={() => {
              setMode('forgot')
              setError(null)
            }}
            style={{ display: 'block', marginLeft: 'auto', marginBottom: '12px', padding: 0, border: 'none', background: 'none', color: 'var(--text-3,#9a9aa6)', fontSize: '11.5px', cursor: 'pointer' }}
          >
            {t('login.forgot')}
          </button>
        )}

        {linkSent && (
          <div role="status" style={{ fontSize: '12.5px', lineHeight: 1.5, color: 'var(--pos,#1f9d5b)', background: 'var(--pos-weak,#e8f6ee)', borderRadius: '9px', padding: '9px 12px', marginBottom: '14px' }}>
            {t('login.linkSent')}
          </div>
        )}
        {error && (
          <div role="alert" style={{ fontSize: '12.5px', color: 'var(--neg,#e5484d)', background: 'var(--neg-weak,#fdecec)', borderRadius: '9px', padding: '9px 12px', marginBottom: '14px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--accent,#6E56CF)',
            color: '#fff',
            fontSize: '13.5px',
            fontWeight: 550,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {isForgot
            ? busy
              ? t('login.sending')
              : t('login.sendLink')
            : isRegister
              ? busy
                ? t('login.creating')
                : t('login.createAccount')
              : busy
                ? t('login.signingIn')
                : t('login.signIn')}
        </button>

        <button
          type="button"
          onClick={switchMode}
          style={{ width: '100%', marginTop: '12px', padding: '8px', border: 'none', background: 'none', color: 'var(--accent,#6E56CF)', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer' }}
        >
          {isRegister || isForgot ? t('login.backToLogin') : t('login.toRegister')}
        </button>

        {!isRegister && !isForgot && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '14px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border,#ececef)' }} />
              <span style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)', textTransform: 'uppercase', letterSpacing: '.05em' }}>of / or</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border,#ececef)' }} />
            </div>
            <button
              type="button"
              onClick={async () => {
                setBusy(true)
                setError(null)
                try {
                  await demoLogin()
                } catch (err) {
                  setError(err.message)
                  setBusy(false)
                }
              }}
              disabled={busy}
              style={{ width: '100%', padding: '11px', borderRadius: '10px', border: '1px solid var(--accent,#6E56CF)', background: 'var(--accent-weak,#f0edfb)', color: 'var(--accent,#6E56CF)', fontSize: '13px', fontWeight: 550, cursor: busy ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t('demo.tryIt')}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
