<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Reset links open the SPA's reset page, not a backend route.
        ResetPassword::createUrlUsing(function ($user, string $token) {
            return rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/')
                .'/reset-password?token='.$token.'&email='.urlencode($user->email);
        });
    }
}
