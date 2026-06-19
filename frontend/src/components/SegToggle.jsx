// Small segmented pill toggle (used for layout & movement-viz switches).
// `options` is an array of [value, label]; `value` is the active one.
export default function SegToggle({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: 'var(--surface-2,#f6f6f8)', border: '1px solid var(--border,#ececef)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
      {options.map(([id, label]) => {
        const active = value === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              padding: '6px 12px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: active ? 550 : 450,
              whiteSpace: 'nowrap',
              background: active ? 'var(--surface)' : 'transparent',
              color: active ? 'var(--text)' : 'var(--text-2)',
              boxShadow: active ? 'var(--shadow)' : 'none',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
