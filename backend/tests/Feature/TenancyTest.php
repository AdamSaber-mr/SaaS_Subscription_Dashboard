<?php

namespace Tests\Feature;

use App\Models\Team;
use App\Models\User;
use App\Services\TeamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenancyTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(): User
    {
        $user = User::factory()->create();
        app(TeamService::class)->seedDefaultPlans($user->team);

        return $user;
    }

    public function test_registration_provisions_team_user_and_default_plans(): void
    {
        $res = $this->postJson('/api/register', [
            'name' => 'Eva Nieuw',
            'company' => 'Acme BV',
            'email' => 'eva@acme.test',
            'password' => 'wachtwoord123',
        ]);

        $res->assertCreated()
            ->assertJsonPath('user.name', 'Eva Nieuw')
            ->assertJsonPath('user.team.name', 'Acme BV')
            ->assertJsonStructure(['user' => ['id', 'team' => ['id', 'name']], 'token']);

        $team = Team::where('name', 'Acme BV')->firstOrFail();
        $this->assertSame(4, $team->plans()->count()); // default tiers provisioned

        // the returned token works and the fresh tenant starts empty
        $headers = ['Authorization' => 'Bearer '.$res->json('token')];
        $this->getJson('/api/customers', $headers)->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/metrics', $headers)->assertOk()->assertJsonPath('kpis.mrr', 0);
    }

    public function test_registration_validates_input(): void
    {
        $this->postJson('/api/register', [
            'name' => 'X',
            'company' => 'Y',
            'email' => 'not-an-email',
            'password' => 'kort',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email', 'password']);

        User::factory()->create(['email' => 'taken@x.test']);
        $this->postJson('/api/register', [
            'name' => 'X', 'company' => 'Y', 'email' => 'taken@x.test', 'password' => 'wachtwoord123',
        ])->assertUnprocessable()->assertJsonValidationErrors(['email']);
    }

    public function test_tenants_only_see_their_own_data(): void
    {
        // Tenant A creates a subscription…
        $alice = $this->makeTenant();
        Sanctum::actingAs($alice);
        $subId = $this->postJson('/api/subscriptions', ['name' => 'Alpha Klant', 'plan' => 'growth'])->json('data.id');
        $customerId = $this->getJson('/api/customers')->json('data.0.id');
        $this->assertSame(99, $this->getJson('/api/metrics')->json('kpis.mrr'));

        // …tenant B sees none of it.
        $bob = $this->makeTenant();
        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($bob);

        $this->getJson('/api/customers')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/subscriptions')->assertJsonPath('meta.total', 0);
        $this->assertSame(0, $this->getJson('/api/metrics')->json('kpis.mrr'));
        $mix = collect($this->getJson('/api/metrics')->json('planMix'));
        $this->assertSame(0, $mix->sum('customers'));
    }

    public function test_cross_tenant_access_reads_as_404(): void
    {
        $alice = $this->makeTenant();
        Sanctum::actingAs($alice);
        $subId = $this->postJson('/api/subscriptions', ['name' => 'Geheim BV', 'plan' => 'scale'])->json('data.id');
        $customerId = $this->getJson('/api/customers')->json('data.0.id');

        $bob = $this->makeTenant();
        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($bob);

        $this->getJson("/api/customers/{$customerId}")->assertNotFound();
        $this->patchJson("/api/subscriptions/{$subId}", ['plan' => 'growth'])->assertNotFound();
        $this->deleteJson("/api/subscriptions/{$subId}")->assertNotFound();

        // and Alice's subscription is untouched
        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($alice);
        $this->getJson('/api/subscriptions')->assertJsonPath('meta.total', 1);
    }

    public function test_teams_can_reuse_plan_slugs_and_customer_emails(): void
    {
        $alice = $this->makeTenant();
        $bob = $this->makeTenant();

        // both teams have their own 'growth' plan
        $this->assertSame(1, $alice->team->plans()->where('slug', 'growth')->count());
        $this->assertSame(1, $bob->team->plans()->where('slug', 'growth')->count());

        // both teams can have a customer with the same synthesized email
        Sanctum::actingAs($alice);
        $this->postJson('/api/subscriptions', ['name' => 'Dubbel BV', 'plan' => 'growth'])->assertCreated();

        $this->app['auth']->forgetGuards();
        Sanctum::actingAs($bob);
        $this->postJson('/api/subscriptions', ['name' => 'Dubbel BV', 'plan' => 'growth'])->assertCreated();
    }
}
