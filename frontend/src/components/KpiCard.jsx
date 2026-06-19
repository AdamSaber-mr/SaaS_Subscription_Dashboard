import { useCountUp } from '../hooks/useCountUp.js'
import InfoTip from './InfoTip.jsx'

// A headline metric card with a counting-up value, delta badge and sparkline.
export default function KpiCard({ label, tip, value, format, deltaStr, deltaPos, deltaNeutral, sub, valueColor, spark, animDeps }) {
  const valueRef = useCountUp(value, format, animDeps)

  const deltaStyle = deltaNeutral
    ? {
        fontSize: '10px',
        fontWeight: 500,
        padding: '2px 7px',
        borderRadius: '20px',
        whiteSpace: 'nowrap',
        color: 'var(--text-3)',
        background: 'var(--surface-2)',
      }
    : {
        fontSize: '11.5px',
        fontWeight: 550,
        padding: '2px 7px',
        borderRadius: '20px',
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
        color: deltaPos ? 'var(--pos)' : 'var(--neg)',
        background: deltaPos ? 'var(--pos-weak)' : 'var(--neg-weak)',
      }

  return (
    <div
      data-enter
      style={{
        background: 'var(--surface,#fff)',
        border: '1px solid var(--border,#ececef)',
        borderRadius: '16px',
        padding: '18px 18px 14px',
        boxShadow: 'var(--shadow)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow .2s, border-color .2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 6px 22px rgba(16,16,20,0.09)'
        e.currentTarget.style.borderColor = 'var(--border-strong,#e0e0e6)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow)'
        e.currentTarget.style.borderColor = 'var(--border,#ececef)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '12px', fontWeight: 500, color: 'var(--text-2,#6b6b78)', letterSpacing: '.01em' }}>
          {label}
          <InfoTip text={tip} />
        </span>
        <span style={deltaStyle}>{deltaStr}</span>
      </div>
      <div
        ref={valueRef}
        style={{
          fontSize: '23px',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          marginTop: '9px',
          color: valueColor,
          fontVariantNumeric: 'tabular-nums',
          whiteSpace: 'nowrap',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {format(value)}
      </div>
      <div style={{ fontSize: '11.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '3px' }}>{sub}</div>
      <svg viewBox="0 0 120 34" preserveAspectRatio="none" style={{ position: 'absolute', right: 0, bottom: 0, width: '38%', height: '30px', opacity: 0.4 }}>
        <path d={spark} fill="none" stroke="var(--accent,#6E56CF)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
