import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useDashboard } from './store/DashboardContext.jsx'
import { rootStyle } from './lib/theme.js'
import Sidebar from './components/Sidebar.jsx'
import Topbar from './components/Topbar.jsx'
import Modal from './components/Modal.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Insights from './pages/Insights.jsx'
import Customers from './pages/Customers.jsx'
import CustomerDetail from './pages/CustomerDetail.jsx'
import Plans from './pages/Plans.jsx'
import Subscriptions from './pages/Subscriptions.jsx'

function Centered({ children }) {
  return (
    <div style={{ flex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg,#fbfbfc)', color: 'var(--text-2,#6b6b78)', fontSize: '13.5px', gap: '10px' }}>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent,#6E56CF)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

export default function App() {
  const { theme, accent, user, authChecking, booted, error, setError } = useDashboard()
  const location = useLocation()

  let content
  if (authChecking) {
    content = (
      <Centered>
        <Spinner /> Checking session…
      </Centered>
    )
  } else if (!user) {
    // Any URL shows the login gate; after signing in you land on that same URL.
    content = <Login />
  } else if (!booted) {
    content = (
      <Centered>
        <Spinner /> Loading your revenue data…
      </Centered>
    )
  } else {
    content = (
      <>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Topbar />
          {/* keyed by path so entrance animations replay on navigation */}
          <div key={location.pathname} style={{ flex: 1, padding: '26px 30px 60px' }}>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
        <Modal />
      </>
    )
  }

  return (
    <div style={rootStyle(theme, accent)}>
      {content}
      {error && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '11px 16px',
            borderRadius: '12px',
            background: 'var(--neg,#e5484d)',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            boxShadow: '0 12px 30px rgba(8,8,12,0.25)',
          }}
        >
          {error}
          <button
            onClick={() => setError(null)}
            style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '7px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}
