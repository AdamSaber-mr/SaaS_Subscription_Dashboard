import { useDashboard } from '../store/DashboardContext.jsx'
import { initial } from '../lib/format.js'
import SegToggle from './SegToggle.jsx'

const NAV = [
  { id: 'dashboard', key: 'nav.dashboard', icon: 'M4 5h6v6H4zM14 5h6v6h-6zM14 14h6v5h-6zM4 14h6v5H4z' },
  { id: 'insights', key: 'nav.insights', icon: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.6.6 1 1.4 1 2.2V16h6v-.3c0-.8.4-1.6 1-2.2A6 6 0 0 0 12 3z' },
  { id: 'customers', key: 'nav.customers', icon: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 19v-1a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8' },
  { id: 'plans', key: 'nav.plans', icon: 'M12 3 3 8l9 5 9-5zM3 16l9 5 9-5M3 12l9 5 9-5' },
  { id: 'subscriptions', key: 'nav.subscriptions', icon: 'M17 2l4 4-4 4M21 6H8a4 4 0 0 0-4 4v1M7 22l-4-4 4-4M3 18h13a4 4 0 0 0 4-4v-1' },
]

function NavButton({ item, active, onClick }) {
  const base = {
    display: 'flex',
    alignItems: 'center',
    gap: '11px',
    width: '100%',
    padding: '9px 12px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: active ? 550 : 450,
    textAlign: 'left',
    background: active ? 'var(--accent-weak)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-2)',
    transition: 'background .15s, color .15s',
  }
  return (
    <button
      onClick={onClick}
      style={base}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'var(--surface-2)'
          e.currentTarget.style.color = 'var(--text)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-2)'
        }
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}>
        <path d={item.icon} />
      </svg>
      <span>{item.label}</span>
    </button>
  )
}

export default function Sidebar() {
  const { route, companyName, theme, toggleTheme, go, user, logout, lang, setLang, t, isMobile, sidebarOpen } = useDashboard()
  const isActive = (id) => (id === 'customers' ? route === 'customers' || route === 'detail' : route === id)

  // Drawer on mobile: simply not rendered while closed (the hamburger in the
  // topbar opens it; navigating closes it again).
  if (isMobile && !sidebarOpen) return null

  const themeLabel = theme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')
  const themeIcon =
    theme === 'light'
      ? 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'
      : 'M12 3v2M12 19v2M5 5l1.5 1.5M17.5 17.5 19 19M3 12h2M19 12h2M5 19l1.5-1.5M17.5 6.5 19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'

  return (
    <aside
      style={{
        width: isMobile ? '272px' : '240px',
        flex: 'none',
        borderRight: '1px solid var(--border,#ececef)',
        background: 'var(--surface,#fff)',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        zIndex: isMobile ? 95 : 'auto',
        boxShadow: isMobile ? '0 0 60px rgba(8,8,12,0.3)' : 'none',
        overflowY: 'auto',
      }}
    >
      <div style={{ padding: '22px 20px 18px', display: 'flex', alignItems: 'center', gap: '11px' }}>
        <div
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '8px',
            background: 'var(--accent,#6E56CF)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
            boxShadow: '0 1px 2px rgba(110,86,207,0.35)',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l5-6 4 4 6-8" />
            <path d="M3 21h18" />
          </svg>
        </div>
        <div style={{ lineHeight: 1.05 }}>
          <div style={{ fontSize: '14.5px', fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--text,#15151b)' }}>{companyName}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)', fontWeight: 450 }}>Revenue OS</div>
        </div>
      </div>

      <nav style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map((item) => (
          <NavButton key={item.id} item={{ ...item, label: t(item.key) }} active={isActive(item.id)} onClick={() => go(item.id)} />
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '14px 16px', borderTop: '1px solid var(--border,#ececef)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 500, color: 'var(--text-3,#9a9aa6)' }}>Taal / Language</span>
          <SegToggle
            options={[
              ['nl', 'NL'],
              ['en', 'EN'],
            ]}
            value={lang}
            onChange={setLang}
          />
        </div>
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            width: '100%',
            padding: '8px 11px',
            borderRadius: '9px',
            border: '1px solid var(--border,#ececef)',
            background: 'var(--surface-2,#f6f6f8)',
            color: 'var(--text-2,#6b6b78)',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d={themeIcon} />
            </svg>
            {themeLabel}
          </span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg,var(--accent,#6E56CF),color-mix(in oklab,var(--accent,#6E56CF),#000 22%))',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11.5px',
              fontWeight: 600,
              flex: 'none',
            }}
          >
            {initial(user?.name || '?')}
          </div>
          <div style={{ lineHeight: 1.15, minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text,#15151b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-3,#9a9aa6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
          </div>
          <button
            onClick={logout}
            title={t('sidebar.signOut')}
            aria-label={t('sidebar.signOut')}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-3,#9a9aa6)', cursor: 'pointer', padding: '5px', borderRadius: '7px', display: 'flex' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--neg,#e5484d)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3,#9a9aa6)')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}
