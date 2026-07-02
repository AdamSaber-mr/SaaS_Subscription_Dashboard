<?php

namespace App\Services;

use App\Enums\SubscriptionStatus;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionEvent;
use Carbon\CarbonImmutable;

/**
 * Computes dashboard metrics from the subscription_events log.
 *
 * Server-side port of the frontend's aggregates() + periodMetrics()
 * (frontend/src/lib/engine.js). The window is the last N calendar months
 * ending in the current month; every number is derived from the same event
 * log so the metrics agree with each other (ARR = MRR×12,
 * net = new + expansion − contraction − churn, …).
 */
class MetricsService
{
    public const PERIODS = ['this_month', 'last_month', 'last_quarter', 'last_12'];

    /** Months of history in the trend/cohort window (mirrors engine.js N). */
    public const N = 18;

    /** Cohort grid: number of signup cohorts / months-since-signup columns. */
    public const COHORT_COLS = 9;

    public function forPeriod(int $teamId, string $period = 'last_12'): array
    {
        if (! in_array($period, self::PERIODS, true)) {
            $period = 'last_12';
        }

        $base = CarbonImmutable::now()->startOfMonth()->subMonths(self::N - 1);
        $monthIndex = fn (CarbonImmutable|string $date) => ($d = CarbonImmutable::parse($date))
            ->year * 12 + $d->month - ($base->year * 12 + $base->month);

        // --- monthly buckets from the event log --------------------------------
        $newM = array_fill(0, self::N, 0);   // cents
        $expM = array_fill(0, self::N, 0);
        $conM = array_fill(0, self::N, 0);
        $chuM = array_fill(0, self::N, 0);
        $newC = array_fill(0, self::N, 0);   // customer counts
        $chuC = array_fill(0, self::N, 0);
        $baseMrr = 0;                        // MRR carried in from before the window

        SubscriptionEvent::query()
            ->where('team_id', $teamId)
            ->select(['type', 'mrr_delta_cents', 'occurred_at'])
            ->orderBy('occurred_at')
            ->each(function (SubscriptionEvent $e) use (&$newM, &$expM, &$conM, &$chuM, &$newC, &$chuC, &$baseMrr, $monthIndex) {
                $m = $monthIndex($e->occurred_at);
                if ($m < 0) {
                    $baseMrr += $e->mrr_delta_cents;

                    return;
                }
                if ($m >= self::N) {
                    return;
                }
                match ($e->type->value) {
                    'new' => [$newM[$m] += $e->mrr_delta_cents, $newC[$m]++],
                    'expansion' => $expM[$m] += $e->mrr_delta_cents,
                    'contraction' => $conM[$m] += -$e->mrr_delta_cents,
                    'churn' => [$chuM[$m] += -$e->mrr_delta_cents, $chuC[$m]++],
                };
            });

        $mrrEnd = [];
        $run = $baseMrr;
        for ($m = 0; $m < self::N; $m++) {
            $run += $newM[$m] + $expM[$m] - $conM[$m] - $chuM[$m];
            $mrrEnd[$m] = $run;
        }

        // --- active customers per month + cohort inputs ------------------------
        $subs = Subscription::query()
            ->where('subscriptions.team_id', $teamId)
            ->join('customers', 'customers.id', '=', 'subscriptions.customer_id')
            ->get(['customers.signed_up_at as signed_up_at', 'subscriptions.status', 'subscriptions.canceled_at'])
            ->map(fn ($s) => [
                'signup' => $monthIndex($s->signed_up_at),
                'churn' => $s->status === SubscriptionStatus::Canceled && $s->canceled_at
                    ? $monthIndex($s->canceled_at)
                    : null,
            ]);

        $activeAt = fn (array $s, int $m) => $s['signup'] <= $m && ($s['churn'] === null || $s['churn'] > $m);

        $activeC = [];
        for ($m = 0; $m < self::N; $m++) {
            $activeC[$m] = $subs->filter(fn ($s) => $activeAt($s, $m))->count();
        }

        // --- period window ------------------------------------------------------
        [$s, $e] = match ($period) {
            'this_month' => [self::N - 1, self::N - 1],
            'last_month' => [self::N - 2, self::N - 2],
            'last_quarter' => [self::N - 3, self::N - 1],
            default => [self::N - 12, self::N - 1],
        };
        $sum = fn (array $arr) => array_sum(array_slice($arr, $s, $e - $s + 1));

        $pNew = $sum($newM);
        $pExp = $sum($expM);
        $pCon = $sum($conM);
        $pChu = $sum($chuM);
        $net = $pNew + $pExp - $pCon - $pChu;

        $startMrr = $s > 0 ? $mrrEnd[$s - 1] : $baseMrr;
        $endMrr = $mrrEnd[$e];
        $startActive = $s > 0 ? $activeC[$s - 1] : 0;
        $endActive = $activeC[$e];

        // Churn as an average monthly rate over the period (stable across
        // 1- and 12-month windows) — mirrors periodMetrics() in engine.js.
        $mc = $mr = $nm = 0;
        for ($i = max($s, 1); $i <= $e; $i++) {
            if ($activeC[$i - 1]) {
                $mc += $chuC[$i] / $activeC[$i - 1];
            }
            if ($mrrEnd[$i - 1]) {
                $mr += $chuM[$i] / $mrrEnd[$i - 1];
            }
            $nm++;
        }
        $custChurn = $nm ? $mc / $nm : 0;
        $revChurn = $nm ? $mr / $nm : 0;

        $arpu = $endActive ? $endMrr / $endActive : 0;
        $ltv = $custChurn ? $arpu / $custChurn : 0;
        $nrr = $startMrr ? ($startMrr + $pExp - $pCon - $pChu) / $startMrr : 0;
        // null = no losses this period (∞ would not survive JSON).
        $quick = $pCon + $pChu ? round(($pNew + $pExp) / ($pCon + $pChu), 4) : null;

        $dollars = fn (int|float $cents) => (int) round($cents / 100);

        return [
            'period' => $period,
            'range' => [$s, $e],
            'kpis' => [
                'mrr' => $dollars($endMrr),
                'arr' => $dollars($endMrr * 12),
                'activeCustomers' => $endActive,
                'netNewMrr' => $dollars($net),
                'deltas' => [
                    'mrr' => $startMrr ? round(($endMrr - $startMrr) / $startMrr, 4) : 0,
                    'customers' => $startActive ? round(($endActive - $startActive) / $startActive, 4) : 0,
                ],
            ],
            'movements' => [
                'newM' => $dollars($pNew),
                'expM' => $dollars($pExp),
                'conM' => $dollars($pCon),
                'chuM' => $dollars($pChu),
                'net' => $dollars($net),
            ],
            'stats' => [
                'nrr' => round($nrr, 4),
                'quickRatio' => $quick,
                'arpu' => $dollars($arpu),
                'ltv' => $dollars($ltv),
                'customerChurn' => round($custChurn, 4),
                'revenueChurn' => round($revChurn, 4),
                'startMrr' => $dollars($startMrr),
                'startActive' => $startActive,
                'newCustomers' => array_sum(array_slice($newC, $s, $e - $s + 1)),
                'churnedCustomers' => array_sum(array_slice($chuC, $s, $e - $s + 1)),
                'churnedTotal' => $subs->whereNotNull('churn')->count(),
            ],
            'trend' => [
                'months' => collect(range(0, self::N - 1))
                    ->map(fn ($m) => $base->addMonths($m)->format('M').' \''.$base->addMonths($m)->format('y'))
                    ->all(),
                'monthsLong' => collect(range(0, self::N - 1))
                    ->map(fn ($m) => $base->addMonths($m)->format('F Y'))
                    ->all(),
                'mrr' => array_map($dollars, $mrrEnd),
                'activeCustomers' => $activeC,
                'newM' => array_map($dollars, $newM),
                'expM' => array_map($dollars, $expM),
                'conM' => array_map($dollars, $conM),
                'chuM' => array_map($dollars, $chuM),
            ],
            'cohort' => $this->cohort($subs, $activeAt, $base),
            'planMix' => $this->planMix($teamId),
        ];
    }

    /**
     * Active customers + MRR per plan tier (→ Plans page, Insights top plan,
     * Subscriptions page stats).
     */
    private function planMix(int $teamId): array
    {
        return Plan::query()
            ->where('team_id', $teamId)
            ->withCount(['subscriptions as customers' => fn ($q) => $q->where('status', SubscriptionStatus::Active)])
            ->orderBy('sort_order')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->slug,
                'name' => $p->name,
                'interval' => $p->interval->value,
                'customers' => $p->customers,
                'mrr' => (int) round($p->customers * $p->mrr_cents / 100),
            ])
            ->all();
    }

    /**
     * Retention grid: % of each signup cohort still active, by months since
     * signup, for the last COHORT_COLS cohorts (mirrors CohortGrid.jsx).
     */
    private function cohort($subs, callable $activeAt, CarbonImmutable $base): array
    {
        $labels = [];
        $sizes = [];
        $grid = [];

        for ($sm = self::N - self::COHORT_COLS; $sm < self::N; $sm++) {
            $cohort = $subs->filter(fn ($s) => $s['signup'] === $sm);
            $size = $cohort->count();
            $row = [];
            for ($k = 0; $k < self::COHORT_COLS; $k++) {
                $at = $sm + $k;
                if ($at > self::N - 1) {
                    $row[] = null;

                    continue;
                }
                $row[] = $size
                    ? round($cohort->filter(fn ($s) => $activeAt($s, $at))->count() / $size, 4)
                    : 0;
            }
            $labels[] = $base->addMonths($sm)->format('M').' \''.$base->addMonths($sm)->format('y');
            $sizes[] = $size;
            $grid[] = $row;
        }

        return ['labels' => $labels, 'sizes' => $sizes, 'grid' => $grid];
    }
}
