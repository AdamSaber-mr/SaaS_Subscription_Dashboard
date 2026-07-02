<?php

namespace Database\Seeders;

use App\Models\Team;
use App\Services\TeamService;
use Illuminate\Database\Seeder;

/**
 * The four default tiers for the demo team. The tier definitions themselves
 * live in TeamService::DEFAULT_PLANS — the same set every new registration
 * gets provisioned with.
 */
class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $team = Team::firstOrCreate(['name' => 'Northwind']);
        app(TeamService::class)->seedDefaultPlans($team);
    }
}
