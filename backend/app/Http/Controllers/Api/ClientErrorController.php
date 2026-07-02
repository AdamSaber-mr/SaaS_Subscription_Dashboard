<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Crash reports from the React error boundary. They land in the Laravel log
 * (stderr → Railway logs) and — once a SENTRY_LARAVEL_DSN is configured —
 * flow through to Sentry via the log channel like any other error.
 */
class ClientErrorController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'stack' => ['nullable', 'string', 'max:8000'],
            'url' => ['nullable', 'string', 'max:500'],
        ]);

        Log::error('client-error: '.$data['message'], [
            'url' => $data['url'] ?? null,
            'stack' => $data['stack'] ?? null,
            'user_id' => $request->user('sanctum')?->id,
        ]);

        return response()->noContent();
    }
}
