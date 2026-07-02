<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * The demo account may look at everything but change nothing: every
 * non-read request is rejected with a marker the SPA turns into a
 * friendly "create your own account" nudge. Logging out stays allowed.
 */
class DenyDemoWrites
{
    public function handle(Request $request, Closure $next)
    {
        $isRead = in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true);

        if (! $isRead && ! $request->is('api/logout') && $request->user()?->is_demo) {
            return response()->json(['message' => 'demo_read_only'], 403);
        }

        return $next($request);
    }
}
