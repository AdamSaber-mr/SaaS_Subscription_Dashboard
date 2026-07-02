<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    public function index(Request $request)
    {
        $plans = Plan::query()
            ->where('team_id', $request->user()->team_id)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return PlanResource::collection($plans);
    }
}
