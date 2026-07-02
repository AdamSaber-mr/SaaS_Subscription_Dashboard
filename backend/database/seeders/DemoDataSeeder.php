<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Plan;
use App\Models\Subscription;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Generates a believable 18-month customer lifecycle (sign-ups, upgrades,
 * downgrades, churn + invoices) so the dashboard tells a story on first load.
 *
 * Faithful PHP port of generateData() in frontend/src/lib/engine.js: the same
 * mulberry32 seed produces the same customers, events and invoices. The only
 * difference is the time window — month index N-1 is the *current* month, so
 * the demo always looks fresh. Run PlanSeeder first.
 */
class DemoDataSeeder extends Seeder
{
    private const N = 18;           // months of history
    private const SEED = 990077;    // mirrors engine.js

    private const LADDER = ['starter', 'growth', 'scale', 'enterprise'];
    private const CHURN_P = [0.058, 0.04, 0.026, 0.012]; // per tier index

    private const NAMES_A = ['North', 'Bright', 'Hyper', 'Cloud', 'Data', 'Next', 'Vertex', 'Atlas', 'Lumen', 'Orbit', 'Pine', 'Quartz', 'Signal', 'Stride', 'Vela', 'Aero', 'Nova', 'Echo', 'Flux', 'Iron', 'Maple', 'Onyx', 'Polar', 'Ridge', 'Sage', 'Tidal', 'Umbra', 'Zephyr', 'Cedar', 'Delta', 'Ember', 'Fable', 'Grove', 'Harbor', 'Juno', 'Kepler', 'Lattice'];
    private const NAMES_B = ['Labs', 'Systems', 'Works', 'Soft', 'Cloud', 'AI', 'Health', 'Pay', 'Logic', 'Metrics', 'Stack', 'Flow', 'Hub', 'Base', 'Grid', 'Forge', 'Loop', 'Desk', 'Bit', 'Core', 'Sync', 'Yard', 'Group', 'Digital', 'Ventures'];
    private const COUNTRIES = [['United States', 'US'], ['United Kingdom', 'GB'], ['Germany', 'DE'], ['Netherlands', 'NL'], ['France', 'FR'], ['Canada', 'CA'], ['Australia', 'AU'], ['Sweden', 'SE'], ['Spain', 'ES'], ['India', 'IN']];
    private const COUNTRY_W = [40, 12, 10, 7, 6, 6, 5, 4, 4, 6];

    private int $rngState = self::SEED;

    public function run(): void
    {
        $team = \App\Models\Team::firstOrCreate(['name' => 'Northwind']);

        $plans = Plan::where('team_id', $team->id)->get()->keyBy('slug');
        if ($plans->isEmpty()) {
            $this->call(PlanSeeder::class);
            $plans = Plan::where('team_id', $team->id)->get()->keyBy('slug');
        }

        // Idempotent: wipe this team's previous demo data (children first for
        // the FKs) — other tenants' data is untouched.
        DB::table('invoices')->where('team_id', $team->id)->delete();
        DB::table('subscription_events')->where('team_id', $team->id)->delete();
        DB::table('subscriptions')->where('team_id', $team->id)->delete();
        DB::table('customers')->where('team_id', $team->id)->delete();

        $this->rngState = self::SEED;
        $generated = $this->generate($plans);

        $base = CarbonImmutable::now()->startOfMonth();
        $today = CarbonImmutable::now()->day;
        // Current-month dates are clamped to today so nothing is future-dated.
        $date = fn (int $month, int $day) => $base
            ->subMonths(self::N - 1 - $month)
            ->day(min($day, 28, ...($month === self::N - 1 ? [$today] : [])))
            ->toDateString();
        $now = now();

        $events = [];
        $invoices = [];
        $usedEmails = [];

        foreach ($generated as $c) {
            $email = $c['email'];
            for ($i = 2; isset($usedEmails[$email]); $i++) {
                $email = str_replace('billing@', "billing{$i}@", $c['email']);
            }
            $usedEmails[$email] = true;

            $customer = Customer::create([
                'team_id' => $team->id,
                'name' => $c['name'],
                'email' => $email,
                'country' => $c['country'],
                'country_code' => $c['country_code'],
                'signed_up_at' => $date($c['signup_month'], $c['signup_day']),
            ]);

            $subscription = Subscription::create([
                'team_id' => $team->id,
                'customer_id' => $customer->id,
                'plan_id' => $plans[$c['plan']]->id,
                'status' => $c['status'],
                'billing_interval' => $plans[$c['plan']]->interval,
                'started_at' => $date($c['signup_month'], $c['signup_day']),
                'canceled_at' => $c['churn_month'] !== null ? $date($c['churn_month'], $c['churn_day']) : null,
            ]);

            foreach ($c['events'] as $e) {
                $events[] = [
                    'team_id' => $team->id,
                    'subscription_id' => $subscription->id,
                    'customer_id' => $customer->id,
                    'type' => $e['type'],
                    'from_plan_id' => $e['from'] !== null ? $plans[$e['from']]->id : null,
                    'to_plan_id' => $plans[$e['plan']]->id,
                    'mrr_delta_cents' => $e['mrr'] * 100,
                    'occurred_at' => $date($e['month'], $e['day']),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            foreach ($c['invoices'] as $inv) {
                $invoices[] = [
                    'team_id' => $team->id,
                    'customer_id' => $customer->id,
                    'subscription_id' => $subscription->id,
                    'plan_id' => $plans[$inv['plan']]->id,
                    'amount_cents' => $inv['amount'] * 100,
                    'status' => $inv['status'],
                    'issued_at' => $date($inv['month'], $inv['day']),
                    'is_retry' => $inv['retry'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($events, 500) as $chunk) {
            DB::table('subscription_events')->insert($chunk);
        }
        foreach (array_chunk($invoices, 500) as $chunk) {
            DB::table('invoices')->insert($chunk);
        }

        $this->command?->info(sprintf(
            'Demo data: %d customers, %d events, %d invoices.',
            count($generated), count($events), count($invoices),
        ));
    }

    /**
     * Port of engine.js generateData(). RNG call order matches the JS source
     * exactly so the dataset is identical to the frontend prototype's.
     * Money is in whole dollars here (like the JS); persisted as cents above.
     *
     * @param  \Illuminate\Support\Collection<string, Plan>  $plans
     * @return list<array<string, mixed>>
     */
    private function generate($plans): array
    {
        $mrr = fn (string $slug) => (int) round($plans[$slug]->mrr_cents / 100);
        $price = fn (string $slug) => (int) round($plans[$slug]->price_cents / 100);

        $customers = [];
        $used = [];

        for ($m = 0; $m < self::N; $m++) {
            $nNew = max(2, (int) round(5 + $m * 0.85 + ($this->rng() * 5 - 2.5)));

            for ($k = 0; $k < $nNew; $k++) {
                $plan = $this->pick(self::LADDER, [46, 33, 15, 6]);
                $name = $this->companyName($used);
                $country = $this->pick(self::COUNTRIES, self::COUNTRY_W);
                $signupDay = 1 + (int) floor($this->rng() * 27);

                $customers[] = [
                    'name' => $name,
                    'email' => 'billing@'.preg_replace('/[^a-z]/', '', strtolower($name)).'.com',
                    'country' => $country[0],
                    'country_code' => $country[1],
                    'signup_month' => $m,
                    'signup_day' => $signupDay,
                    'plan' => $plan,
                    'status' => 'active',
                    'churn_month' => null,
                    'churn_day' => null,
                    'events' => [
                        ['type' => 'new', 'month' => $m, 'from' => null, 'plan' => $plan, 'mrr' => $mrr($plan), 'day' => $signupDay],
                    ],
                    'invoices' => [],
                ];
            }

            foreach ($customers as &$c) {
                if ($c['signup_month'] >= $m || $c['status'] !== 'active') {
                    continue;
                }
                $ti = array_search($c['plan'], self::LADDER, true);
                $churnP = self::CHURN_P[$ti];
                $upP = $ti < 3 ? 0.04 : 0;
                $downP = $ti > 0 ? 0.02 : 0;
                $r = $this->rng();
                $day = 1 + (int) floor($this->rng() * 27);

                if ($r < $churnP) {
                    $c['status'] = 'canceled';
                    $c['churn_month'] = $m;
                    $c['churn_day'] = $day;
                    $c['events'][] = ['type' => 'churn', 'month' => $m, 'from' => $c['plan'], 'plan' => $c['plan'], 'mrr' => -$mrr($c['plan']), 'day' => $day];
                } elseif ($r < $churnP + $upP) {
                    $np = self::LADDER[$ti + 1];
                    $c['events'][] = ['type' => 'expansion', 'month' => $m, 'from' => $c['plan'], 'plan' => $np, 'mrr' => $mrr($np) - $mrr($c['plan']), 'day' => $day];
                    $c['plan'] = $np;
                } elseif ($r < $churnP + $upP + $downP) {
                    $np = self::LADDER[$ti - 1];
                    $c['events'][] = ['type' => 'contraction', 'month' => $m, 'from' => $c['plan'], 'plan' => $np, 'mrr' => $mrr($np) - $mrr($c['plan']), 'day' => $day];
                    $c['plan'] = $np;
                }
            }
            unset($c);
        }

        // Invoices — monthly per active month; annual plans bill on the signup anniversary.
        foreach ($customers as &$c) {
            $end = $c['churn_month'] ?? self::N - 1;
            for ($m = $c['signup_month']; $m <= $end; $m++) {
                $pid = $this->planAtMonth($c, $m);
                if ($pid === null) {
                    continue;
                }
                if ($plans[$pid]->interval->value === 'year' && ($m - $c['signup_month']) % 12 !== 0) {
                    continue;
                }
                $amount = $price($pid);
                $day = min($c['signup_day'], 28);
                $rr = $this->rng();
                $status = $rr < 0.035 ? 'failed' : ($rr < 0.05 ? 'refunded' : 'paid');
                $c['invoices'][] = ['month' => $m, 'day' => $day, 'amount' => $amount, 'status' => $status, 'plan' => $pid, 'retry' => false];
                if ($status === 'failed') {
                    $c['invoices'][] = ['month' => $m, 'day' => min($day + 2, 28), 'amount' => $amount, 'status' => 'paid', 'plan' => $pid, 'retry' => true];
                }
            }
        }
        unset($c);

        return $customers;
    }

    /** Which plan the customer was on in month $m (null once churned). */
    private function planAtMonth(array $c, int $m): ?string
    {
        $plan = null;
        foreach ($c['events'] as $e) {
            if ($e['month'] > $m) {
                break;
            }
            if (in_array($e['type'], ['new', 'expansion', 'contraction'], true)) {
                $plan = $e['plan'];
            }
            if ($e['type'] === 'churn' && $e['month'] < $m) {
                $plan = null;
            }
        }

        return $plan;
    }

    /** @param  array<string, bool>  $used */
    private function companyName(array &$used): string
    {
        $g = 0;
        do {
            $a = self::NAMES_A[(int) floor($this->rng() * count(self::NAMES_A))];
            $b = self::NAMES_B[(int) floor($this->rng() * count(self::NAMES_B))];
            $name = $a.' '.$b;
            $g++;
        } while (isset($used[$name]) && $g < 20);
        $used[$name] = true;

        return $name;
    }

    /** Weighted pick — port of pick() in engine.js (one rng() call). */
    private function pick(array $arr, array $weights): mixed
    {
        $r = $this->rng() * array_sum($weights);
        foreach ($arr as $i => $item) {
            $r -= $weights[$i];
            if ($r <= 0) {
                return $item;
            }
        }

        return $arr[count($arr) - 1];
    }

    /** mulberry32 — bit-exact port of the JS PRNG in engine.js. */
    private function rng(): float
    {
        $this->rngState = ($this->rngState + 0x6D2B79F5) & 0xFFFFFFFF;
        $a = $this->rngState;
        $t = $this->imul32($a ^ ($a >> 15), $a | 1);
        $t = (($t + $this->imul32($t ^ ($t >> 7), $t | 61)) & 0xFFFFFFFF) ^ $t;

        return (($t ^ ($t >> 14)) & 0xFFFFFFFF) / 4294967296;
    }

    /** Low 32 bits of a 32×32-bit multiply (JS Math.imul) without 64-bit overflow. */
    private function imul32(int $a, int $b): int
    {
        $a &= 0xFFFFFFFF;
        $b &= 0xFFFFFFFF;
        $lo = ($a & 0xFFFF) * $b;
        $hi = ((($a >> 16) * $b) & 0xFFFF) << 16;

        return ($lo + $hi) & 0xFFFFFFFF;
    }
}
