import { useMemo } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'
import { periodMetrics } from '../lib/engine.js'

// Derives every period-scoped metric (MRR, churn, NRR, movements, …) from the
// current aggregates + selected period.
export function usePeriodMetrics() {
  const { aggregates, period, version } = useDashboard()
  return useMemo(() => periodMetrics(aggregates, period), [aggregates, period, version])
}
