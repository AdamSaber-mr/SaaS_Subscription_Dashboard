<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

/**
 * The four fixed tiers — mirrors PLANS + PLAN_RAMP in frontend/src/lib/engine.js.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            ['slug' => 'starter',    'name' => 'Starter',    'blurb' => 'For small teams getting started',   'price_cents' => 2900,    'interval' => 'month', 'mrr_cents' => 2900,  'ramp_color' => '#C3B8EE', 'sort_order' => 0],
            ['slug' => 'growth',     'name' => 'Growth',     'blurb' => 'Growing teams that need more room',  'price_cents' => 9900,    'interval' => 'month', 'mrr_cents' => 9900,  'ramp_color' => '#9A84E6', 'sort_order' => 1],
            ['slug' => 'scale',      'name' => 'Scale',      'blurb' => 'Scaling companies, advanced controls', 'price_cents' => 29900, 'interval' => 'month', 'mrr_cents' => 29900, 'ramp_color' => '#6E56CF', 'sort_order' => 2],
            ['slug' => 'enterprise', 'name' => 'Enterprise', 'blurb' => 'Custom terms, billed annually',      'price_cents' => 1198800, 'interval' => 'year',  'mrr_cents' => 99900, 'ramp_color' => '#4B3494', 'sort_order' => 3],
        ];

        foreach ($plans as $plan) {
            Plan::updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
