<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TeamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoModeTest extends TestCase
{
    use RefreshDatabase;

    private function provisionDemo(): User
    {
        $demo = User::factory()->create(['is_demo' => true]);
        app(TeamService::class)->seedDefaultPlans($demo->team);

        return $demo;
    }

    public function test_demo_endpoint_issues_a_token_for_the_demo_user(): void
    {
        $demo = $this->provisionDemo();

        $res = $this->postJson('/api/demo');

        $res->assertOk()
            ->assertJsonPath('user.id', $demo->id)
            ->assertJsonPath('user.is_demo', true)
            ->assertJsonStructure(['token']);
    }

    public function test_demo_endpoint_without_demo_user_is_unavailable(): void
    {
        $this->postJson('/api/demo')->assertStatus(503);
    }

    public function test_demo_user_can_read_but_not_write(): void
    {
        $this->provisionDemo();
        $headers = ['Authorization' => 'Bearer '.$this->postJson('/api/demo')->json('token')];

        // reads work
        $this->getJson('/api/metrics', $headers)->assertOk();
        $this->getJson('/api/customers', $headers)->assertOk();
        $this->getJson('/api/plans', $headers)->assertOk();

        // every write is blocked with the demo marker
        $this->postJson('/api/subscriptions', ['name' => 'X', 'plan' => 'growth'], $headers)
            ->assertForbidden()->assertJsonPath('message', 'demo_read_only');
        $this->postJson('/api/plans', ['name' => 'X', 'price' => 1, 'interval' => 'month'], $headers)
            ->assertForbidden()->assertJsonPath('message', 'demo_read_only');
        $this->patchJson('/api/settings/profile', ['name' => 'X', 'email' => 'x@x.test'], $headers)
            ->assertForbidden()->assertJsonPath('message', 'demo_read_only');
        $this->putJson('/api/settings/password', [], $headers)
            ->assertForbidden()->assertJsonPath('message', 'demo_read_only');

        // nothing was created
        $this->assertDatabaseMissing('customers', ['name' => 'X']);

        // logging out is still allowed
        $this->postJson('/api/logout', [], $headers)->assertNoContent();
    }

    public function test_regular_users_are_unaffected_by_the_demo_guard(): void
    {
        $this->provisionDemo();
        $user = User::factory()->create();
        app(TeamService::class)->seedDefaultPlans($user->team);
        \Laravel\Sanctum\Sanctum::actingAs($user);

        $this->postJson('/api/subscriptions', ['name' => 'Echte Klant', 'plan' => 'growth'])->assertCreated();
    }
}
