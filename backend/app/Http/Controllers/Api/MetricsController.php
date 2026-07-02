<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MetricsService;
use Illuminate\Http\Request;

class MetricsController extends Controller
{
    public function __construct(private readonly MetricsService $metrics) {}

    /** Dashboard + Insights metrics for a period (?period=last_12). */
    public function index(Request $request)
    {
        $period = $request->string('period')->value() ?: 'last_12';

        return response()->json($this->metrics->forPeriod($request->user()->team_id, $period));
    }
}
