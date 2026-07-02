<?php

namespace App\Http\Resources;

use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Plan */
class PlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->slug,
            'planId' => $this->id, // numeric id, needed for plan management
            'name' => $this->name,
            'blurb' => $this->blurb,
            'price' => $this->price_cents / 100,
            'interval' => $this->interval->value,
            'mrr' => $this->mrr_cents / 100,
            'rampColor' => $this->ramp_color,
        ];
    }
}
