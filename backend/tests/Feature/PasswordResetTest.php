<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_sends_a_reset_link_pointing_at_the_spa(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'vergeet@x.test']);

        $this->postJson('/api/forgot-password', ['email' => 'vergeet@x.test'])
            ->assertOk()->assertJsonPath('message', 'reset_link_sent');

        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use ($user) {
            $url = ResetPassword::$createUrlCallback
                ? call_user_func(ResetPassword::$createUrlCallback, $user, $notification->token)
                : '';

            return str_contains($url, '/reset-password?token=') && str_contains($url, urlencode($user->email));
        });
    }

    public function test_unknown_and_demo_emails_get_the_same_generic_answer_without_mail(): void
    {
        Notification::fake();
        $demo = User::factory()->create(['is_demo' => true, 'email' => 'demo@x.test']);

        $this->postJson('/api/forgot-password', ['email' => 'bestaatniet@x.test'])
            ->assertOk()->assertJsonPath('message', 'reset_link_sent');
        $this->postJson('/api/forgot-password', ['email' => 'demo@x.test'])
            ->assertOk()->assertJsonPath('message', 'reset_link_sent');

        Notification::assertNothingSent();
    }

    public function test_a_valid_token_resets_the_password_and_revokes_sessions(): void
    {
        $user = User::factory()->create(['email' => 'reset@x.test']);
        $user->createToken('old-session');
        $token = app('auth.password.broker')->createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => 'reset@x.test',
            'password' => 'gloednieuw123',
            'password_confirmation' => 'gloednieuw123',
        ])->assertOk()->assertJsonPath('message', 'password_reset');

        // old password out, new password in, old sessions gone
        $this->postJson('/api/login', ['email' => 'reset@x.test', 'password' => 'password'])->assertUnprocessable();
        $this->postJson('/api/login', ['email' => 'reset@x.test', 'password' => 'gloednieuw123'])->assertOk();
        $this->assertSame(0, $user->tokens()->where('name', 'old-session')->count());
    }

    public function test_an_invalid_token_is_rejected(): void
    {
        User::factory()->create(['email' => 'reset@x.test']);

        $this->postJson('/api/reset-password', [
            'token' => 'nep-token',
            'email' => 'reset@x.test',
            'password' => 'gloednieuw123',
            'password_confirmation' => 'gloednieuw123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }
}
