import { useDashboard } from '../store/DashboardContext.jsx'
import { PERIODS } from '../lib/periods.js'
import SegToggle from './SegToggle.jsx'

export default function Topbar() {
  const { route, period, setPeriod, openNewSub, t } = useDashboard()
  const titles = t('titles.' + route)
  const [title, sub] = Array.isArray(titles) ? titles : t('titles.dashboard')

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px 18px',
        flexWrap: 'wrap',
        padding: '16px 24px',
        background: 'color-mix(in oklab,var(--bg,#fbfbfc) 88%, transparent)',
        backdropFilter: 'saturate(1.1) blur(8px)',
        borderBottom: '1px solid var(--border,#ececef)',
      }}
    >
      <div>
        <div style={{ fontSize: '18.5px', fontWeight: 600, letterSpacing: '-0.015em', color: 'var(--text,#15151b)' }}>{title}</div>
        <div style={{ fontSize: '12.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '1px' }}>{sub}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <SegToggle options={PERIODS.map(([id]) => [id, t('period.' + id)])} value={period} onChange={setPeriod} />
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
