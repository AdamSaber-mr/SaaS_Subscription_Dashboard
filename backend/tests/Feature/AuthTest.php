<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_user_and_token(): void
    {
        $user = User::factory()->create(['email' => 'ava@northwind.test']);

        $res = $this->postJson('/api/login', [
            'email' => 'ava@northwind.test',
            'password' => 'password',
        ]);

        $res->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token']);
        $this->assertArrayNotHasKey('password', $res->json('user'));
    }

    public function test_login_rejects_wrong_password(): void
    {
        User::factory()->create(['email' => 'ava@northwind.test']);

        $this->postJson('/api/login', [
            'email' => 'ava@northwind.test',
            'password' => 'wrong',
        ])->assertUnprocessable();
    }

    public function test_data_routes_require_authentication(): void
    {
        foreach (['/api/metrics', '/api/customers', '/api/plans', '/api/subscriptions', '/api/user'] as $path) {
            $this->getJson($path)->assertUnauthorized();
        }
        $this->postJson('/api/subscriptions', [])->assertUnauthorized();
    }

    public function test_logout_revokes_the_token(): void
    {
        User::factory()->create(['email' => 'ava@northwind.test']);

        $token = $this->postJson('/api/login', [
            'email' => 'ava@northwind.test',
            'password' => 'password',
        ])->json('token');

        $headers = ['Authorization' => 'Bearer '.$token];
        $this->getJson('/api/user', $headers)->assertOk();
        $this->postJson('/api/logout', [], $headers)->assertNoContent();

        $this->assertDatabaseCount('personal_access_tokens', 0);
        // The auth manager memoizes the resolved guard within one app
        // instance; reset it so the next request re-authenticates.
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/user', $headers)->assertUnauthorized();
    }
}
