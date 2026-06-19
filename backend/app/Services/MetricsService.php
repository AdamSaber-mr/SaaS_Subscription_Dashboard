<?php

namespace App\Services;

/**
 * Computes dashboard metrics from the subscription_events log.
 *
 * STUB — this is the server-side port of the frontend's
 * `aggregates()` + `periodMetrics()` (see frontend/src/lib/engine.js and
 * backend/docs/02-api-endpoints.md). For now it returns a correctly-shaped,
 * zeroed payload so the API contract holds; the real aggregation lands in the
 * implementation phase.
 */
class MetricsService
{
    public const PERIODS = ['this_month', 'last_month', 'last_quarter', 'last_12'];

    public function forPeriod(string $period = 'last_12'): array
    {
        if (! in_array($period, self::PERIODS, true)) {
            $period = 'last_12';
        }

        // TODO(impl): aggregate subscription_events + invoices into these numbers.
        return [
            'period' => $period,
            'kpis' => [
                'mrr' => 0,
                'arr' => 0,
                'activeCustomers' => 0,
                'netNewMrr' => 0,
                'deltas' => ['mrr' => 0, 'customers' => 0],
            ],
            'movements' => [
                'newM' => 0, 'expM' => 0, 'conM' => 0, 'chuM' => 0, 'net' => 0,
            ],
            'stats' => [
                'nrr' => 0, 'quickRatio' => 0, 'arpu' => 0,
                'ltv' => 0, 'customerChurn' => 0, 'revenueChurn' => 0,
            ],
            'trend' => ['months' => [], 'mrr' => [], 'activeCustomers' => []],
            'cohort' => ['labels' => [], 'grid' => []],
        ];
    }
}
