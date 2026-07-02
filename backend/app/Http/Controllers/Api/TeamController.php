<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;

class TeamController extends Controller
{
    /** Everyone in the team plus the invitations still waiting. */
    public function members(Request $request)
    {
        $teamId = $request->user()->team_id;

        return response()->json([
            'members' => User::where('team_id', $teamId)
                ->orderBy('created_at')
                ->get(['id', 'name', 'email', 'created_at']),
            'invitations' => TeamInvitation::where('team_id', $teamId)
                ->whereNull('accepted_at')
                ->where('expires_at', '>', now())
                ->orderByDesc('created_at')
                ->get()
                ->map(fn ($inv) => [
                    'id' => $inv->id,
                    'email' => $inv->email,
                    'url' => $inv->url(),
                    'expiresAt' => $inv->expires_at->toDateString(),
                ]),
        ]);
    }

    /** Invite a colleague by email; the invite link also comes back for copy-paste. */
    public function invite(Request $request)
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:190']]);
        $teamId = $request->user()->team_id;

        if (User::where('email', $data['email'])->exists()) {
            throw ValidationException::withMessages(['email' => ['invite_email_taken']]);
        }

        // re-inviting the same address refreshes the token and expiry
        $invitation = TeamInvitation::updateOrCreate(
            ['team_id' => $teamId, 'email' => strtolower($data['email'])],
            [
                'invited_by' => $request->user()->id,
                'token' => TeamInvitation::generateToken(),
                'expires_at' => now()->addDays(7),
                'accepted_at' => null,
            ],
        );

        try {
            Notification::route('mail', $invitation->email)->notify(new \App\Notifications\TeamInviteNotification($invitation));
        } catch (\Throwable $e) {
            // the copyable invite link below still works without mail
            report($e);
        }

        return response()->json([
            'id' => $invitation->id,
            'email' => $invitation->email,
            'url' => $invitation->url(),
            'expiresAt' => $invitation->expires_at->toDateString(),
        ], 201);
    }

    /** Revoke a pending invitation (team-scoped: foreign ids read as 404). */
    public function revoke(Request $request, int $invitation)
    {
        TeamInvitation::where('team_id', $request->user()->team_id)
            ->findOrFail($invitation)
            ->delete();

        return response()->noContent();
    }

    /** Public: what the invitee sees before accepting. */
    public function show(string $token)
    {
        $invitation = TeamInvitation::where('token', $token)->first();
        abort_unless($invitation && $invitation->isUsable(), 404);

        return response()->json([
            'team' => $invitation->team->name,
            'email' => $invitation->email,
        ]);
    }

    /** Public: accept — creates the user inside the team and signs them in. */
    public function accept(Request $request, string $token)
    {
        $invitation = TeamInvitation::where('token', $token)->first();
        abort_unless($invitation && $invitation->isUsable(), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if (User::where('email', $invitation->email)->exists()) {
            throw ValidationException::withMessages(['email' => ['invite_email_taken']]);
        }

        $user = DB::transaction(function () use ($invitation, $data) {
            $invitation->update(['accepted_at' => now()]);

            return User::create([
                'name' => $data['name'],
                'email' => $invitation->email,
                'password' => $data['password'],
                'team_id' => $invitation->team_id,
            ]);
        });

        return response()->json([
            'user' => $user->load('team'),
            'token' => $user->createToken('spa')->plainTextToken,
        ], 201);
    }
}
