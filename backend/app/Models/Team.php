<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * The tenant. Every user belongs to one team, and every domain row
 * (plans, customers, subscriptions, events, invoices) is owned by one.
 */
class Team extends Model
{
    use HasFactory;

    protected $fillable = ['name'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }
}
