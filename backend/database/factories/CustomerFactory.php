<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Customer> */
class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'team_id' => \App\Models\Team::factory(),
            'name' => fake()->unique()->company(),
            'email' => fake()->unique()->safeEmail(),
            'country' => 'United States',
            'country_code' => 'US',
            'signed_up_at' => now()->subMonths(3)->toDateString(),
        ];
    }
}
