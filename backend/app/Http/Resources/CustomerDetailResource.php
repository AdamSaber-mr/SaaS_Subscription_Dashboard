<?php

namespace App\Http\Resources;

use App\Enums\InvoiceStatus;
use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Customer detail with subscription timeline and payment history.
 * Expects subscription.plan, events.{fromPlan,toPlan} and invoices eager loaded.
 *
 * @mixin Customer
 */
class CustomerDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $sub = $this->subscription;
        $plan = $sub?->plan;
        $active = $sub?->status === SubscriptionStatus::Active;

        $lifetimePaid = $this->invoices
            ->where('status', InvoiceStatus::Paid)
            ->sum('amount_cents') / 100;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'country' => $this->country,
            'status' => $sub?->status->value ?? 'churned',
            'subscriptionId' => $sub?->id,
            'plan' => $plan ? ['id' => $plan->slug, 'name' => $plan->name] : null,
            'currentMrr' => $active && $plan ? $plan->mrr_cents / 100 : 0,
            'lifetimePaid' => $lifetimePaid,
            'signedUpAt' => $this->signed_up_at?->toDateString(),
            'timeline' => $this->events
                // id desc breaks same-day ties chronologically (newest first)
                ->sortBy([['occurred_at', 'desc'], ['id', 'desc']])
                ->values()
                ->map(fn ($e) => [
                    'type' => $e->type->value,
                    'fromPlan' => $e->fromPlan?->name,
                    'toPlan' => $e->toPlan?->name,
                    'date' => $e->occurred_at?->toDateString(),
                ]),
            'invoices' => $this->invoices
                ->sortBy([['issued_at', 'desc'], ['id', 'desc']])
                ->values()
                ->map(fn ($iv) => [
                    'amount' => $iv->amount_cents / 100,
                    'status' => $iv->status->value,
                    'date' => $iv->issued_at?->toDateString(),
                    'isRetry' => $iv->is_retry,
                ]),
        ];
    }
}
