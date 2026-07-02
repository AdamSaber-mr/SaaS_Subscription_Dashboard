<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TeamInvitation extends Model
{
    protected $fillable = ['team_id', 'invited_by', 'email', 'token', 'expires_at', 'accepted_at'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function isUsable(): bool
    {
        return $this->accepted_at === null && $this->expires_at->isFuture();
    }

    public static function generateToken(): string
    {
        return Str::random(64);
    }

    /** The SPA page where the invitee lands. */
    public function url(): string
    {
        return rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/').'/invite?token='.$this->token;
    }
}
