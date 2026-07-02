<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * Chrome's Private/Local Network Access: when a public https page (the
 * GitHub Pages build) calls this locally running API, the preflight asks
 * for explicit permission. Answering it lets browsers that honor the
 * header proceed; newer Chrome additionally shows a one-time user prompt.
 */
class AllowPrivateNetwork
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($request->headers->get('Access-Control-Request-Private-Network') === 'true') {
            $response->headers->set('Access-Control-Allow-Private-Network', 'true');
        }

        return $response;
    }
}
