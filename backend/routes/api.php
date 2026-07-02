<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\MetricsController;
use App\Http\Controllers\Api\PlanController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\SubscriptionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
| Endpoints consumed by the React SPA in frontend/. See
| backend/docs/02-api-endpoints.md for the full contract.
|
| Token auth (Sanctum): POST /login returns a bearer token; every data
| route requires it via auth:sanctum.
*/

// Auth
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:30,1');
Route::post('/demo', [AuthController::class, 'demo'])->middleware('throttle:15,1');
Route::post('/forgot-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'forgot'])->middleware('throttle:5,1');
Route::post('/reset-password', [\App\Http\Controllers\Api\PasswordResetController::class, 'reset'])->middleware('throttle:10,1');

// Crash reports from the SPA's error boundary (public: crashes can happen pre-login)
Route::post('/client-errors', [\App\Http\Controllers\Api\ClientErrorController::class, 'store'])->middleware('throttle:10,1');

Route::middleware(['auth:sanctum', \App\Http\Middleware\DenyDemoWrites::class])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Settings
    Route::patch('/settings/profile', [SettingsController::class, 'updateProfile']);
    Route::put('/settings/password', [SettingsController::class, 'updatePassword']);
    Route::patch('/settings/team', [SettingsController::class, 'updateTeam']);

    // Plans (per-team tiers)
    Route::get('/plans', [PlanController::class, 'index']);
    Route::post('/plans', [PlanController::class, 'store']);
    Route::patch('/plans/{plan}', [PlanController::class, 'update']);
    Route::delete('/plans/{plan}', [PlanController::class, 'destroy']);

    // Metrics
    Route::get('/metrics', [MetricsController::class, 'index']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);

    // CSV import
    Route::post('/import/customers', [\App\Http\Controllers\Api\ImportController::class, 'customers'])->middleware('throttle:10,1');

    // Subscription lifecycle
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::post('/subscriptions', [SubscriptionController::class, 'store']);
    Route::patch('/subscriptions/{subscription}', [SubscriptionController::class, 'update']);
    Route::delete('/subscriptions/{subscription}', [SubscriptionController::class, 'destroy']);
});
