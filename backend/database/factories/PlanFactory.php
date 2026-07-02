<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Plan> */
class PlanFactory extends Factory
{
    public function definition(): array
    {
        return [
            'team_id' => \App\Models\Team::factory(),
            'slug' => fake()->unique()->slug(2),
            'name' => ucfirst(fake()->unique()->word()),
            'blurb' => fake()->sentence(4),
            'price_cents' => 9900,
            'interval' => 'month',
            'mrr_cents' => 9900,
            'ramp_color' => '#6E56CF',
            'sort_order' => 0,
        ];
    }
}
