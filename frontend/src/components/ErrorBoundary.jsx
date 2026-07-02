import { Component } from 'react'

const API = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '')

/**
 * Catches render crashes anywhere in the app: shows a friendly recovery
 * screen and reports the error to the backend (→ server logs / Sentry).
 * Bilingual static copy — it must work even if i18n itself crashed.
 */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    fetch(API + '/client-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        message: String(error?.message || error).slice(0, 2000),
        stack: String(info?.componentStack || error?.stack || '').slice(0, 8000),
        url: window.location.href.slice(0, 500),
      }),
    }).catch(() => {
      // reporting is best-effort; never crash the crash screen
    })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fbfbfc', padding: '24px', fontFamily: "'Geist',-apple-system,sans-serif" }}>
        <div style={{ maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ fontSize: '44px', marginBottom: '12px' }}>😵</div>
          <div style={{ fontSize: '18px', fontWeight: 650, color: '#15151b' }}>Er ging iets mis / Something went wrong</div>
          <div style={{ fontSize: '13px', color: '#6b6b78', marginTop: '8px', lineHeight: 1.5 }}>
            De fout is automatisch gerapporteerd. Herlaad de pagina om verder te gaan.
            <br />
            The error was reported automatically. Reload the page to continue.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '18px', padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#6E56CF', color: '#fff', fontSize: '13.5px', fontWeight: 550, cursor: 'pointer' }}
          >
            Herladen / Reload
          </button>
        </div>
      </div>
    )
  }
}
