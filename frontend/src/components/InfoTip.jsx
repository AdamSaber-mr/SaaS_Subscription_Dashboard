import { useState } from 'react'

// A small ⓘ icon that reveals a plain-language explanation on hover.
// Self-contained: positions a fixed bubble above the icon while hovered.
export default function InfoTip({ text, size = 13 }) {
  const [tip, setTip] = useState(null)

  const onEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    setTip({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top) })
  }
  const onLeave = () => setTip(null)

  return (
    <>
      <span
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          marginLeft: '5px',
          cursor: 'help',
          color: 'var(--text-3,#9a9aa6)',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </span>
      {tip && (
        <div
          style={{
            position: 'fixed',
            left: tip.x + 'px',
            top: tip.y - 10 + 'px',
            transform: 'translate(-50%,-100%)',
            maxWidth: '248px',
            background: 'var(--surface)',
            color: 'var(--text-2)',
            border: '1px solid var(--border-strong)',
            borderRadius: '11px',
            boxShadow: '0 10px 30px rgba(8,8,12,0.18)',
            padding: '10px 13px',
            fontSize: '12px',
            lineHeight: 1.5,
            zIndex: 300,
            pointerEvents: 'none',
          }}
        >
          {text}
        </div>
      )}
    </>
  )
}
