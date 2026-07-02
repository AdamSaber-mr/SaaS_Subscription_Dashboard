<?php

/*
 * Cross-origin config for the React SPA (frontend/, Vite dev server).
 * Token auth via the Authorization header — no cookies, so no credentials.
 */
return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:5173'),
        'http://127.0.0.1:5173',
    ]),

    // The Vercel builds of the frontend (production + preview deployments).
    'allowed_origins_patterns' => [
        '#^https://saas-subscription-dashboard[a-z0-9-]*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
