<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetController extends Controller
{
    /**
     * Email a reset link. Always answers with the same generic 200 so the
     * endpoint can't be used to probe which addresses have an account.
     */
    public function forgot(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->input('email'))->first();
        if ($user && ! $user->is_demo) {
            try {
                Password::sendResetLink(['email' => $user->email]);
            } catch (\Throwable $e) {
                // a mail outage must not leak through the generic answer;
                // the failure goes to the logs/Sentry instead
                report($e);
            }
        }

        return response()->json(['message' => 'reset_link_sent']);
    }

    /** Set a new password with a valid token; every session is revoked. */
    public function reset(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->update(['password' => $password]);
                $user->tokens()->delete(); // stolen sessions die with the old password
            },
        );

        if ($status !== Password::PasswordReset) {
            throw ValidationException::withMessages(['email' => ['invalid_reset_token']]);
        }

        return response()->json(['message' => 'password_reset']);
    }
}
