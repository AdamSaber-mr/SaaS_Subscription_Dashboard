<?php

namespace App\Services;

use App\Enums\EventType;
use App\Enums\InvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use App\Models\Plan;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

/**
 * Owns the subscription lifecycle transitions and writes the matching
 * subscription_event for each (so metrics stay derivable from the event log).
 *
 * Ports the frontend's doNewSub() / doChangePlan() / doCancel()
 * (frontend/src/store/DashboardContext.jsx), with one deliberate fix: a
 * reactivation books a `new` event restoring the *full* plan MRR — the earlier
 * churn event already removed all of it, so a plan-diff delta would corrupt
 * the running MRR.
 */
class SubscriptionService
{
    /**
     * Create a customer + subscription + first invoice + `new` event.
     *
     * @param  array{name: string, plan: string, email?: ?string, country?: ?string, country_code?: ?string}  $data
     */
    public function create(array $data, int $teamId): Subscription
    {
        return DB::transaction(function () use ($data, $teamId) {
            $plan = Plan::where('team_id', $teamId)->where('slug', $data['plan'])->firstOrFail();
            $name = trim($data['name']) !== '' ? trim($data['name']) : 'New Customer';
            $today = now()->toDateString();

            $customer = Customer::create([
                'team_id' => $teamId,
                'name' => $name,
                'email' => $data['email'] ?? $this->uniqueEmail($name, $teamId),
                'country' => $data['country'] ?? 'United States',
                'country_code' => $data['country_code'] ?? 'US',
                'signed_up_at' => $today,
            ]);

            $subscription = $customer->subscription()->create([
                'team_id' => $teamId,
                'plan_id' => $plan->id,
                'status' => SubscriptionStatus::Active,
                'billing_interval' => $plan->interval,
                'started_at' => $today,
            ]);

            $subscription->events()->create([
                'team_id' => $teamId,
                'customer_id' => $customer->id,
                'type' => EventType::New,
                'to_plan_id' => $plan->id,
                'mrr_delta_cents' => $plan->mrr_cents,
                'occurred_at' => $today,
            ]);

            $subscription->invoices()->create([
                'team_id' => $teamId,
                'customer_id' => $customer->id,
                'plan_id' => $plan->id,
                'amount_cents' => $plan->price_cents,
                'status' => InvoiceStatus::Paid,
                'issued_at' => $today,
            ]);

            return $subscription;
        });
    }

    /**
     * Move a subscription to a new plan, appending an expansion/contraction
     * event — or reactivate a canceled one with a fresh `new` event + invoice.
     */
    public function changePlan(Subscription $subscription, string $planSlug): Subscription
    {
        return DB::transaction(function () use ($subscription, $planSlug) {
            $plan = Plan::where('team_id', $subscription->team_id)->where('slug', $planSlug)->firstOrFail();
            $current = $subscription->plan;
            $today = now()->toDateString();

            if ($subscription->status === SubscriptionStatus::Canceled) {
                // Reactivation: churn already removed the full MRR, so the
                // full new-plan MRR comes back (works for the same plan too).
                $subscription->update([
                    'plan_id' => $plan->id,
                    'status' => SubscriptionStatus::Active,
                    'billing_interval' => $plan->interval,
                    'canceled_at' => null,
                ]);

                $subscription->events()->create([
                    'team_id' => $subscription->team_id,
                    'customer_id' => $subscription->customer_id,
                    'type' => EventType::New,
                    'from_plan_id' => $current->id,
                    'to_plan_id' => $plan->id,
                    'mrr_delta_cents' => $plan->mrr_cents,
                    'occurred_at' => $today,
                ]);

                $subscription->invoices()->create([
                    'team_id' => $subscription->team_id,
                    'customer_id' => $subscription->customer_id,
                    'plan_id' => $plan->id,
                    'amount_cents' => $plan->price_cents,
                    'status' => InvoiceStatus::Paid,
                    'issued_at' => $today,
                ]);

                return $subscription;
            }

            if ($plan->id === $current->id) {
                return $subscription; // no-op
            }

            $delta = $plan->mrr_cents - $current->mrr_cents;

            $subscription->update([
                'plan_id' => $plan->id,
                'billing_interval' => $plan->interval,
            ]);

            $subscription->events()->create([
                'team_id' => $subscription->team_id,
                'customer_id' => $subscription->customer_id,
                'type' => $delta > 0 ? EventType::Expansion : EventType::Contraction,
                'from_plan_id' => $current->id,
                'to_plan_id' => $plan->id,
                'mrr_delta_cents' => $delta,
                'occurred_at' => $today,
            ]);

            return $subscription;
        });
    }

    /**
     * Cancel a subscription, appending a `churn` event. Idempotent — canceling
     * an already-canceled subscription is a no-op.
     */
    public function cancel(Subscription $subscription): Subscription
    {
        return DB::transaction(function () use ($subscription) {
            if ($subscription->status === SubscriptionStatus::Canceled) {
                return $subscription;
            }

            $today = now()->toDateString();

            $subscription->update([
                'status' => SubscriptionStatus::Canceled,
                'canceled_at' => $today,
            ]);

            $subscription->events()->create([
                'team_id' => $subscription->team_id,
                'customer_id' => $subscription->customer_id,
                'type' => EventType::Churn,
                'from_plan_id' => $subscription->plan_id,
                'to_plan_id' => $subscription->plan_id,
                'mrr_delta_cents' => -$subscription->plan->mrr_cents,
                'occurred_at' => $today,
            ]);

            return $subscription;
        });
    }

    /** billing@<name>.com like the frontend, suffixed if taken (per team). */
    private function uniqueEmail(string $name, int $teamId): string
    {
        $slug = preg_replace('/[^a-z]/', '', strtolower($name)) ?: 'customer';
        $email = "billing@{$slug}.com";

        for ($i = 2; Customer::where('team_id', $teamId)->where('email', $email)->exists(); $i++) {
            $email = "billing{$i}@{$slug}.com";
        }

        return $email;
    }
}
