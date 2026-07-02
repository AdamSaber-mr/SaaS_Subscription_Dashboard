<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\MetricsController;
use App\Http\Controllers\Api\PlanController;
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
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Reference & metrics
    Route::get('/plans', [PlanController::class, 'index']);
    Route::get('/metrics', [MetricsController::class, 'index']);

    // Customers
    Route::get('/customers', [CustomerController::class, 'index']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);

    // Subscription lifecycle
    Route::get('/subscriptions', [SubscriptionController::class, 'index']);
    Route::post('/subscriptions', [SubscriptionController::class, 'store']);
    Route::patch('/subscriptions/{subscription}', [SubscriptionController::class, 'update']);
    Route::delete('/subscriptions/{subscription}', [SubscriptionController::class, 'destroy']);
});
