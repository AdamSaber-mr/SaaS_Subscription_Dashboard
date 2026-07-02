import { useEffect, useRef, useState } from 'react'

// Shared plumbing for the hand-built SVG charts: a resize-aware container
// hook, "nice" axis ticks, a smooth line path, and one tooltip component.

/** Track the rendered width of a container (ResizeObserver). */
export function useSize() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

/**
 * Round an axis up to a clean bound with evenly spaced ticks. Searches step
 * sizes (1/2/2.5/5 × 10ⁿ) and tick counts, keeping the tightest bound that
 * still clears the data by ~2% — so the marks fill the plot instead of air.
 */
export function niceScale(maxValue, preferredTicks = 4) {
  if (maxValue <= 0) return { max: 1, ticks: [0, 1] }
  const target = maxValue * 1.02
  let best = null
  const baseMag = Math.pow(10, Math.floor(Math.log10(target)) - 1)
  for (const magMult of [1, 10, 100]) {
    for (const m of [1, 2, 2.5, 5]) {
      const step = m * baseMag * magMult
      for (let k = 3; k <= Math.max(4, preferredTicks + 1); k++) {
        const bound = step * k
        if (bound >= target && (!best || bound < best.max)) best = { max: bound, step, k }
      }
    }
  }
  if (!best) return { max: target, ticks: [0, target] }
  return { max: best.max, ticks: Array.from({ length: best.k + 1 }, (_, i) => i * best.step) }
}

/** Catmull-Rom → cubic bezier: a smooth line through every point. */
export function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

/** Rect with only the data-end (top) corners rounded; square at the baseline. */
export function roundedTopRect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, Math.abs(h))
  if (h <= 0) return ''
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

/**
 * One floating readout: value leads (strong), label follows. Positioned above
 * the anchor point, clamped to the chart bounds. Pointer-transparent.
 */
export function ChartTooltip({ tip, width }) {
  if (!tip) return null
  const clampedX = Math.min(Math.max(tip.x, 70), Math.max(70, width - 70))
  return (
    <div
      style={{
        position: 'absolute',
        left: clampedX + 'px',
        top: tip.y + 'px',
        transform: 'translate(-50%, -100%) translateY(-10px)',
        padding: '8px 11px',
        background: 'var(--surface,#fff)',
        border: '1px solid var(--border,#ececef)',
        borderRadius: '9px',
        boxShadow: '0 8px 22px rgba(8,8,12,0.16)',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: '10.5px', color: 'var(--text-3,#9a9aa6)', marginBottom: '3px' }}>{tip.label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', fontWeight: 600, color: 'var(--text,#15151b)', fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ width: '10px', height: '3px', borderRadius: '2px', background: tip.color, flex: 'none' }} />
        {tip.value}
      </div>
    </div>
  )
}
