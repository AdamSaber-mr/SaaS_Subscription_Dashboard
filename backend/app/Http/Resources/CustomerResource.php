<?php

namespace App\Http\Resources;

use App\Enums\SubscriptionStatus;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A single row in the Customers list. Expects `subscription.plan` to be eager
 * loaded by the controller.
 *
 * @mixin Customer
 */
class CustomerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $sub = $this->subscription;
        $plan = $sub?->plan;
        $active = $sub?->status === SubscriptionStatus::Active;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'country' => $this->country,
            'plan' => $plan ? ['id' => $plan->slug, 'name' => $plan->name] : null,
            'mrr' => $active && $plan ? $plan->mrr_cents / 100 : null,
            'status' => $sub?->status->value ?? 'churned',
            'signedUpAt' => $this->signed_up_at?->toDateString(),
        ];
    }
}
