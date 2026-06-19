<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
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
            'user' => $user,
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
        return $request->user();
    }
}
