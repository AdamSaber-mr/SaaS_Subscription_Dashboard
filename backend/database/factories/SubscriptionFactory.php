<?php

namespace Database\Factories;

use App\Enums\PlanInterval;
use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Subscription> */
class SubscriptionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'plan_id' => Plan::factory(),
            'status' => SubscriptionStatus::Active,
            'billing_interval' => PlanInterval::Month,
            'started_at' => now()->subMonths(3)->toDateString(),
        ];
    }

    public function canceled(?string $canceledAt = null): static
    {
        return $this->state([
            'status' => SubscriptionStatus::Canceled,
            'canceled_at' => $canceledAt ?? now()->toDateString(),
        ]);
    }
}
