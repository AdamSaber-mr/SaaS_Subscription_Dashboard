<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\TeamService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** Register a new tenant: team + first user + default plans. */
    public function register(Request $request, TeamService $teams)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'company' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user = DB::transaction(function () use ($data, $teams) {
            $team = $teams->provision($data['company']);

            return User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'team_id' => $team->id,
            ]);
        });

        return response()->json([
            'user' => $user->load('team'),
            'token' => $user->createToken('spa')->plainTextToken,
        ], 201);
    }

    /**
     * Issue a token for the read-only demo account — visitors explore the
     * seeded Northwind tenant without registering. Writes are blocked by
     * the DenyDemoWrites middleware.
     */
    public function demo()
    {
        $demo = User::where('is_demo', true)->first();
        abort_unless($demo, 503, 'Demo account not provisioned');

        return response()->json([
            'user' => $demo->load('team'),
            'token' => $demo->createToken('demo')->plainTextToken,
        ]);
    }

    /** Authenticate and issue a Sanctum token. */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return response()->json([
            'user' => $user->load('team'),
            'token' => $user->createToken('spa')->plainTextToken,
        ]);
    }

    /** Revoke the current token. */
    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->noContent();
    }

    /** The authenticated user (→ sidebar profile). */
    public function user(Request $request)
    {
        return $request->user()->load('team');
    }
}
