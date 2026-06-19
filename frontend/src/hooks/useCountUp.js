import { useEffect, useRef } from 'react'

// Animates a numeric value up to `target` by writing directly to the DOM node
// (no per-frame re-render). `format` turns the running value into display text.
// Throttle-safe: if the tab is hidden or reduced-motion is on, it snaps to the
// final value instead of getting stuck.
export function useCountUp(target, format, deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce || (typeof document !== 'undefined' && document.hidden)) {
      el.textContent = format(target)
      el.__cur = target
      return
    }

    const from = typeof el.__cur === 'number' ? el.__cur : 0
    if (from === target) {
      el.textContent = format(target)
      return
    }
    let raf
    const dur = 750
    const t0 = performance.now()
    const ease = (x) => 1 - Math.pow(1 - x, 3)
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur)
      const v = from + (target - from) * ease(p)
      el.textContent = format(v)
      el.__cur = v
      if (p < 1) raf = requestAnimationFrame(step)
      else el.__cur = target
    }
    el.textContent = format(from)
    raf = requestAnimationFrame(step)
    return () => raf && cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ...deps])

  return ref
}
