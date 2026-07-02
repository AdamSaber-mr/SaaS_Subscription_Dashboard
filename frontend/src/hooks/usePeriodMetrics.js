import { useMemo } from 'react'
import { useDashboard } from '../store/DashboardContext.jsx'

// Adapts the /api/metrics payload to the flat period-metrics shape the pages
// consume (field names kept from the original client-side engine).
export function usePeriodMetrics() {
  const { metrics } = useDashboard()
  return useMemo(() => {
    if (!metrics) return null
    const { kpis, movements, stats } = metrics
    return {
      newM: movements.newM,
      expM: movements.expM,
      conM: movements.conM,
      chuM: movements.chuM,
      net: movements.net,
      endMRR: kpis.mrr,
      endActive: kpis.activeCustomers,
      startMRR: stats.startMrr,
      startActive: stats.startActive,
      newCust: stats.newCustomers,
      chuCust: stats.churnedCustomers,
      nrr: stats.nrr,
      quick: stats.quickRatio, // null when the period had no losses
      arpu: stats.arpu,
      ltv: stats.ltv,
      custChurn: stats.customerChurn,
      revChurn: stats.revenueChurn,
      deltas: kpis.deltas,
    }
  }, [metrics])
}
