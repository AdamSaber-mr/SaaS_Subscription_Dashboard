// Small stat tile used on the Customers / Subscriptions / CustomerDetail pages.
export default function StatCard({ label, value, sub, color = 'var(--text)' }) {
  return (
    <div style={{ background: 'var(--surface,#fff)', border: '1px solid var(--border,#ececef)', borderRadius: '14px', padding: '15px 16px', boxShadow: 'var(--shadow)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text-2,#6b6b78)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '21px', fontWeight: 600, letterSpacing: '-0.01em', marginTop: '6px', color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)', marginTop: '2px' }}>{sub}</div>}
    </div>
  )
}
