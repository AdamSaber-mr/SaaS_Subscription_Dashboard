<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id', 'name', 'email', 'country', 'country_code', 'signed_up_at',
    ];

    protected function casts(): array
    {
        return [
            'signed_up_at' => 'date',
        ];
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(SubscriptionEvent::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }
}
