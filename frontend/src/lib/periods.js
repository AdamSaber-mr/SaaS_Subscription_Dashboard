// The period filter options (mirrors MetricsService::PERIODS in the backend).

export const PERIODS = [
  ['this_month', 'This month'],
  ['last_month', 'Last month'],
  ['last_quarter', 'Last quarter'],
  ['last_12', '12 months'],
]

export function periodLabel(p) {
  return PERIODS.find((x) => x[0] === p)[1].toLowerCase()
}
