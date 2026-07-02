<?php

namespace App\Services;

use App\Models\Team;

/**
 * Provisions a new tenant: the team itself plus the four default plan tiers,
 * so a fresh account has a working plan picker from the first click.
 * Used by registration and by the seeders (single source of truth for tiers).
 */
class TeamService
{
    /** The default tiers — the validated ordinal ramp lives in the frontend too. */
    public const DEFAULT_PLANS = [
        ['slug' => 'starter',    'name' => 'Starter',    'blurb' => 'For small teams getting started',     'price_cents' => 2900,    'interval' => 'month', 'mrr_cents' => 2900,  'ramp_color' => '#AC9BE6', 'sort_order' => 0],
        ['slug' => 'growth',     'name' => 'Growth',     'blurb' => 'Growing teams that need more room',    'price_cents' => 9900,    'interval' => 'month', 'mrr_cents' => 9900,  'ramp_color' => '#8E77DB', 'sort_order' => 1],
        ['slug' => 'scale',      'name' => 'Scale',      'blurb' => 'Scaling companies, advanced controls', 'price_cents' => 29900,   'interval' => 'month', 'mrr_cents' => 29900, 'ramp_color' => '#6E56CF', 'sort_order' => 2],
        ['slug' => 'enterprise', 'name' => 'Enterprise', 'blurb' => 'Custom terms, billed annually',        'price_cents' => 1198800, 'interval' => 'year',  'mrr_cents' => 99900, 'ramp_color' => '#4B3494', 'sort_order' => 3],
    ];

    public function provision(string $name): Team
    {
        $team = Team::create(['name' => $name]);
        $this->seedDefaultPlans($team);

        return $team;
    }

    public function seedDefaultPlans(Team $team): void
    {
        foreach (self::DEFAULT_PLANS as $plan) {
            $team->plans()->updateOrCreate(['slug' => $plan['slug']], $plan);
        }
    }
}
