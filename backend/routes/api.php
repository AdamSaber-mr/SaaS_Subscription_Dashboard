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
| NOTE: data routes are public for now. Wrap them in
| Route::middleware('auth:sanctum') once login is built on the frontend.
*/

// Auth
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');

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
