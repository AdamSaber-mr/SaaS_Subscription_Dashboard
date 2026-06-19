<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Generates a believable 18-month customer lifecycle (sign-ups, upgrades,
 * downgrades, churn + invoices) so the dashboard tells a story on first load.
 *
 * STUB — this is the PHP port of generateData() in frontend/src/lib/engine.js
 * (seeded RNG → customers, subscriptions, subscription_events, invoices).
 * Lands in the implementation phase. Run PlanSeeder first.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // TODO(impl): port the mulberry32-seeded generator from engine.js:
        //   - 18 months, growing sign-ups with natural noise
        //   - per-plan churn / upgrade / downgrade probabilities
        //   - invoices (paid / failed+retry / refunded)
        // Persist into customers, subscriptions, subscription_events, invoices.
    }
}
