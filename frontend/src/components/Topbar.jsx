import { useDashboard } from '../store/DashboardContext.jsx'
import { PERIODS } from '../lib/periods.js'
import SegToggle from './SegToggle.jsx'

export default function Topbar() {
  const { route, period, setPeriod, openNewSub, t, isMobile, setSidebarOpen } = useDashboard()
  const titles = t('titles.' + route)
  const [title, sub] = Array.isArray(titles) ? titles : t('titles.dashboard')

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px 18px',
        flexWrap: 'wrap',
        padding: isMobile ? '12px 14px' : '16px 24px',
        background: 'color-mix(in oklab,var(--bg,#fbfbfc) 88%, transparent)',
        backdropFilter: 'saturate(1.1) blur(8px)',
        borderBottom: '1px solid var(--border,#ececef)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Menu"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', border: '1px solid var(--border,#ececef)', background: 'var(--surface,#fff)', color: 'var(--text,#15151b)', cursor: 'pointer', flex: 'none' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: isMobile ? '16.5px' : '18.5px', fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--text,#15151b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {!isMobile && <div style={{ fontSize: '12.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '1px' }}>{sub}</div>}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', minWidth: 0, maxWidth: '100%' }}>
        {/* the four period pills are wider than a phone — scroll them in place */}
        <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <SegToggle options={PERIODS.map(([id]) => [id, t('period.' + id)])} value={period} onChange={setPeriod} />
        </div>
        <button
          onClick={openNewSub}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '9px 14px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--accent,#6E56CF)',
            color: '#fff',
            fontSize: '12.5px',
            fontWeight: 550,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(110,86,207,0.3)',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-strong,#5B45B8)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent,#6E56CF)')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('newSub')}
        </button>
      </div>
    </header>
  )
}
