// Design tokens for light & dark themes (Stripe/Mercury-style: white, airy, subtle lines).
// Applied as CSS custom properties on the app root so every component can read them.

export const FONT =
  "'Geist',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"

const LIGHT = {
  '--bg': '#FBFBFC',
  '--surface': '#FFFFFF',
  '--surface-2': '#F5F5F8',
  '--border': '#ECECEF',
  '--border-strong': '#E0E0E6',
  '--text': '#15151B',
  '--text-2': '#646472',
  '--text-3': '#9A9AA6',
  '--pos': '#1F9D5B',
  '--pos-weak': '#E8F6EE',
  '--neg': '#E5484D',
  '--neg-weak': '#FBEBEB',
  '--shadow':
    '0 1px 2px rgba(16,16,20,0.04),0 1px 3px rgba(16,16,20,0.05)',
}

const DARK = {
  '--bg': '#0B0B0F',
  '--surface': '#141419',
  '--surface-2': '#1B1B22',
  '--border': '#26262F',
  '--border-strong': '#343440',
  '--text': '#F2F2F5',
  '--text-2': '#9B9BA8',
  '--text-3': '#676772',
  '--pos': '#3DD68C',
  '--pos-weak': '#14241C',
  '--neg': '#FF6166',
  '--neg-weak': '#2A1517',
  '--shadow': '0 1px 2px rgba(0,0,0,0.4),0 2px 6px rgba(0,0,0,0.35)',
}

// Build the root CSS-variable style object for a theme + accent colour.
export function rootStyle(theme, accent) {
  const tk = { ...(theme === 'light' ? LIGHT : DARK) }
  tk['--accent'] = accent
  tk['--accent-weak'] = `color-mix(in oklab, ${accent} 12%, transparent)`
  tk['--accent-strong'] = `color-mix(in oklab, ${accent}, #000 16%)`
  tk.colorScheme = theme
  tk.minHeight = '100vh'
  tk.display = 'flex'
  tk.background = 'var(--bg)'
  tk.color = 'var(--text)'
  tk.fontFamily = FONT
  tk.fontVariantNumeric = 'tabular-nums'
  tk.WebkitFontSmoothing = 'antialiased'
  tk.letterSpacing = '-0.005em'
  return tk
}

// Ordinal plan ramp (starter → enterprise), one hue, light→dark. Validated
// per mode with the dataviz palette checker: every step clears the 2:1
// surface-contrast floor and adjacent steps stay distinguishable. The dark
// ramp is its own set of steps (higher tier = further from the dark surface),
// not a flipped copy of the light one.
export const PLAN_RAMPS = {
  light: { starter: '#AC9BE6', growth: '#8E77DB', scale: '#6E56CF', enterprise: '#4B3494' },
  dark: { starter: '#6E56CF', growth: '#8A70DC', scale: '#AB97EA', enterprise: '#CEC3F2' },
}

export function planRampFor(theme) {
  return PLAN_RAMPS[theme === 'light' ? 'light' : 'dark']
}

// Resolved (non-variable) colours for ApexCharts and SVG, which can't read CSS vars reliably.
export function chartColors(theme, accent) {
  const isLight = theme === 'light'
  return {
    isLight,
    t1: isLight ? '#15151B' : '#F2F2F5',
    t2: isLight ? '#646472' : '#9B9BA8',
    t3: isLight ? '#9A9AA6' : '#676772',
    grid: isLight ? '#ECECEF' : '#26262F',
    border: isLight ? '#ECECEF' : '#26262F',
    surface: isLight ? '#FFFFFF' : '#141419',
    surface2: isLight ? '#F5F5F8' : '#1B1B22',
    pos: isLight ? '#1F9D5B' : '#3DD68C',
    neg: isLight ? '#E5484D' : '#FF6166',
    accent,
  }
}
