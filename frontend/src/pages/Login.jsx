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

// Dev convenience: prefilled so signing in is one click while testing.
// TODO: remove the prefill before anything production-like.
export default function Login() {
  const { login, companyName } = useDashboard()
  const [email, setEmail] = useState('adamsaber.db@gmail.com')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(email, password)
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
            <div style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text,#15151b)' }}>{companyName}</div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)' }}>Revenue OS</div>
          </div>
        </div>

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-2,#6b6b78)', marginBottom: '6px' }} htmlFor="login-email">
          Email
        </label>
        <input id="login-email" type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" style={{ ...field, marginBottom: '14px' }} />

        <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--text-2,#6b6b78)', marginBottom: '6px' }} htmlFor="login-password">
          Password
        </label>
        <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...field, marginBottom: '18px' }} />

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
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '16px', textAlign: 'center' }}>
          Demo account: ava@northwind.test · password
        </div>
      </form>
    </div>
  )
}
