import { useDashboard } from '../../store/DashboardContext.jsx'
import { chartColors, FONT } from '../../lib/theme.js'
import { usdShort } from '../../lib/format.js'

// Sankey-style flow: green streams (new + upgrades) merge into a central "Net"
// node, red streams (downgrades + cancellations) flow out to the right.
export default function FlowChart({ m, net }) {
  const { theme, accent } = useDashboard()
  const colors = chartColors(theme, accent)
  const isLight = colors.isLight
  const animate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const fIn = [
    { label: 'New customers', v: m.newM },
    { label: 'Upgrades', v: m.expM },
  ]
  const fOut = [
    { label: 'Downgrades', v: m.conM },
    { label: 'Cancellations', v: m.chuM },
  ]
  const inSum = m.newM + m.expM
  const outSum = m.conM + m.chuM

  const VBW = 560, VBH = 280, MIDY = 140
  const fscale = 160 / Math.max(1, Math.max(inSum, outSum))
  const fgap = 42
  const LNx = 16, LNw = 34, CLx = 250, Cw = 70, CRx = 320, RNx = 510, RNw = 34
  const inCH = inSum * fscale, outCH = outSum * fscale
  const cyTopIn = MIDY - inCH / 2, cyTopOut = MIDY - outCH / 2
  const leftTotal = inSum * fscale + fgap * (fIn.length - 1)
  const rightTotal = outSum * fscale + fgap * (fOut.length - 1)

  const ribbons = [], nodes = [], labels = []
  let cyi = cyTopIn, lyi = MIDY - leftTotal / 2
  fIn.forEach((f) => {
    const h = Math.max(7, f.v * fscale)
    const ly0 = lyi, ly1 = lyi + h, cy0 = cyi, cy1 = cyi + h, mx = (LNx + LNw + CLx) / 2
    ribbons.push({
      fill: colors.pos,
      lineOpacity: isLight ? 0.55 : 0.4,
      ribbon: `M${LNx + LNw},${ly0.toFixed(1)} C${mx},${ly0.toFixed(1)} ${mx},${cy0.toFixed(1)} ${CLx},${cy0.toFixed(1)} L${CLx},${cy1.toFixed(1)} C${mx},${cy1.toFixed(1)} ${mx},${ly1.toFixed(1)} ${LNx + LNw},${ly1.toFixed(1)} Z`,
      line: `M${LNx + LNw},${((ly0 + ly1) / 2).toFixed(1)} C${mx},${((ly0 + ly1) / 2).toFixed(1)} ${mx},${((cy0 + cy1) / 2).toFixed(1)} ${CLx},${((cy0 + cy1) / 2).toFixed(1)}`,
    })
    nodes.push({ x: LNx, y: ly0.toFixed(1), w: LNw, h: h.toFixed(1), fill: colors.pos })
    labels.push({ x: LNx, y: (ly0 - 7).toFixed(1), anchor: 'start', color: colors.t2, valColor: colors.pos, text: f.label, val: '+' + usdShort(f.v) })
    cyi += h
    lyi += h + fgap
  })
  let cyo = cyTopOut, ryo = MIDY - rightTotal / 2
  fOut.forEach((f) => {
    const h = Math.max(7, f.v * fscale)
    const oy0 = cyo, oy1 = cyo + h, ry0 = ryo, ry1 = ryo + h, mx = (CRx + RNx) / 2
    ribbons.push({
      fill: colors.neg,
      lineOpacity: isLight ? 0.55 : 0.4,
      ribbon: `M${CRx},${oy0.toFixed(1)} C${mx},${oy0.toFixed(1)} ${mx},${ry0.toFixed(1)} ${RNx},${ry0.toFixed(1)} L${RNx},${ry1.toFixed(1)} C${mx},${ry1.toFixed(1)} ${mx},${oy1.toFixed(1)} ${CRx},${oy1.toFixed(1)} Z`,
      line: `M${CRx},${((oy0 + oy1) / 2).toFixed(1)} C${mx},${((oy0 + oy1) / 2).toFixed(1)} ${mx},${((ry0 + ry1) / 2).toFixed(1)} ${RNx},${((ry0 + ry1) / 2).toFixed(1)}`,
    })
    nodes.push({ x: RNx, y: ry0.toFixed(1), w: RNw, h: h.toFixed(1), fill: colors.neg })
    labels.push({ x: RNx + RNw, y: (ry0 - 7).toFixed(1), anchor: 'end', color: colors.t2, valColor: colors.neg, text: f.label, val: '−' + usdShort(f.v) })
    cyo += h
    ryo += h + fgap
  })
  const cTop = Math.min(cyTopIn, cyTopOut)
  const cBot = Math.max(cyTopIn + inCH, cyTopOut + outCH)
  const center = {
    x: CLx, y: cTop.toFixed(1), w: Cw, h: Math.max(40, cBot - cTop).toFixed(1),
    cx: CLx + Cw / 2, ty: (MIDY - 5).toFixed(1), vy: (MIDY + 13).toFixed(1),
    netStr: (net >= 0 ? '+' : '') + usdShort(net), color: net >= 0 ? colors.pos : colors.neg,
    surf2: colors.surface2, border: colors.border,
  }

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '248px', display: 'block', overflow: 'visible' }}>
      {ribbons.map((rb, i) => (
        <g key={i}>
          <path d={rb.ribbon} fill={rb.fill} fillOpacity="0.82" />
          <path d={rb.line} fill="none" stroke="#ffffff" strokeOpacity={rb.lineOpacity} strokeWidth="2.5" strokeDasharray="2 10" strokeLinecap="round">
            {animate && <animate attributeName="stroke-dashoffset" from="24" to="0" dur="1.1s" repeatCount="indefinite" />}
          </path>
        </g>
      ))}
      <rect x={center.x} y={center.y} width={center.w} height={center.h} rx="11" fill={center.surf2} stroke={center.border} />
      <text x={center.cx} y={center.ty} textAnchor="middle" fontSize="10" fontFamily={FONT} fill={center.color} opacity="0.8">Net</text>
      <text x={center.cx} y={center.vy} textAnchor="middle" fontSize="15" fontWeight="700" fontFamily={FONT} fill={center.color}>{center.netStr}</text>
      {nodes.map((nd, i) => (
        <rect key={i} x={nd.x} y={nd.y} width={nd.w} height={nd.h} rx="6" fill={nd.fill} />
      ))}
      {labels.map((lb, i) => (
        <text key={i} x={lb.x} y={lb.y} textAnchor={lb.anchor} fontSize="11" fontFamily={FONT} fill={lb.color}>
          <tspan fontWeight="600">{lb.text}</tspan>
          <tspan dx="6" fontWeight="700" fill={lb.valColor}>{lb.val}</tspan>
        </text>
      ))}
    </svg>
  )
}
