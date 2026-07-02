// Shared badge styles for plan chips and subscription status pills.

export function planBadge(color) {
  return { fontSize: '11px', fontWeight: 550, padding: '3px 9px', borderRadius: '7px', color: '#fff', background: color || 'var(--accent)' }
}

export function statusStyle(active) {
  return {
    fontSize: '11px',
    fontWeight: 550,
    padding: '3px 9px',
    borderRadius: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    color: active ? 'var(--pos)' : 'var(--text-3)',
    background: active ? 'var(--pos-weak)' : 'var(--surface-2)',
  }
}
