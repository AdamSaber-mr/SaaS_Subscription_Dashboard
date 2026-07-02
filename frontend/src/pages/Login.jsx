import { useState } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'

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
  const { login, register, t } = useDashboard()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  // Dev convenience: prefilled so signing in is one click while testing.
  // TODO: remove the prefill before anything production-like.
  const [email, setEmail] = useState('adamsaber.db@gmail.com')
  const [password, setPassword] = useState('password')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register')
    setError(null)
    if (!isRegister) {
      setEmail('')
      setPassword('')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (isRegister) await register({ name, company, email, password })
      else await login(email, password)
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
            <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)' }}>{isRegister ? t('login.createAccount') : t('login.signIn')}</div>
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

        <label style={labelStyle} htmlFor="login-email">
          {t('login.email')}
        </label>
        <input id="login-email" type="email" required autoFocus={!isRegister} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={{ ...field, marginBottom: '14px' }} />

        <label style={labelStyle} htmlFor="login-password">
          {t('login.password')}
        </label>
        <input id="login-password" type="password" required minLength={isRegister ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...field, marginBottom: '18px' }} />

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
          {isRegister ? (busy ? t('login.creating') : t('login.createAccount')) : busy ? t('login.signingIn') : t('login.signIn')}
        </button>

        <button
          type="button"
          onClick={switchMode}
          style={{ width: '100%', marginTop: '12px', padding: '8px', border: 'none', background: 'none', color: 'var(--accent,#6E56CF)', fontSize: '12.5px', fontWeight: 550, cursor: 'pointer' }}
        >
          {isRegister ? t('login.toLogin') : t('login.toRegister')}
        </button>

        {!isRegister && (
          <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '10px', textAlign: 'center' }}>
            {t('login.demo', { email: 'ava@northwind.test', password: 'password' })}
          </div>
        )}
      </form>
    </div>
  )
}
