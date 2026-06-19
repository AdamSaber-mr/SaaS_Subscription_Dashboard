<?php

namespace App\Http\Resources;

use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A subscription row for the Subscriptions page and lifecycle mutation
 * responses. Expects `customer` and `plan` eager loaded.
 *
 * @mixin Subscription
 */
class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer' => [
                'id' => $this->customer?->id,
                'name' => $this->customer?->name,
            ],
            'plan' => $this->plan ? ['id' => $this->plan->slug, 'name' => $this->plan->name] : null,
            'mrr' => $this->plan ? $this->plan->mrr_cents / 100 : 0,
            'status' => $this->status->value,
            'interval' => $this->billing_interval->value,
            'startedAt' => $this->started_at?->toDateString(),
        ];
    }
}
