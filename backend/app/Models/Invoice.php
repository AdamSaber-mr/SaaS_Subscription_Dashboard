<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    protected $fillable = [
        'team_id', 'customer_id', 'subscription_id', 'plan_id',
        'amount_cents', 'status', 'issued_at', 'is_retry',
    ];

    protected function casts(): array
    {
        return [
            'status' => InvoiceStatus::class,
            'amount_cents' => 'integer',
            'issued_at' => 'date',
            'is_retry' => 'boolean',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function subscription(): BelongsTo
    {
        return $this->belongsTo(Subscription::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }
}
