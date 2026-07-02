<?php

namespace App\Models;

use App\Enums\PlanInterval;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug', 'name', 'blurb', 'price_cents', 'interval',
        'mrr_cents', 'ramp_color', 'sort_order', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'interval' => PlanInterval::class,
            'price_cents' => 'integer',
            'mrr_cents' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
