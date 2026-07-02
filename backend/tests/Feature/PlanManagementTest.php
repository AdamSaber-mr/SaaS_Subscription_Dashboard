<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TeamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PlanManagementTest extends TestCase
{
    use RefreshDatabase;

    protected \App\Models\Team $team;

    protected function setUp(): void
    {
        parent::setUp();
        $user = User::factory()->create();
        $this->team = $user->team;
        app(TeamService::class)->seedDefaultPlans($this->team);
        Sanctum::actingAs($user);
    }

    public function test_a_monthly_plan_can_be_created(): void
    {
        $res = $this->postJson('/api/plans', [
            'name' => 'Premium Plus',
            'blurb' => 'Alles erop en eraan',
            'price' => 149.50,
            'interval' => 'month',
        ]);

        $res->assertCreated()
            ->assertJsonPath('data.id', 'premium-plus')
            ->assertJsonPath('data.price', 149.5)
            ->assertJsonPath('data.mrr', 149.5);

        // it shows up in the team's plan list
        $ids = collect($this->getJson('/api/plans')->json('data'))->pluck('id');
        $this->assertTrue($ids->contains('premium-plus'));
    }

    public function test_a_yearly_plan_recognizes_monthly_mrr(): void
    {
        $res = $this->postJson('/api/plans', [
            'name' => 'Jaardeal',
            'price' => 1200,
            'interval' => 'year',
        ]);

        $res->assertCreated()->assertJsonPath('data.mrr', 100); // 1200 / 12
    }

    public function test_duplicate_names_get_unique_slugs(): void
    {
        $this->postJson('/api/plans', ['name' => 'Extra', 'price' => 10, 'interval' => 'month'])->assertCreated();
        $this->postJson('/api/plans', ['name' => 'Extra', 'price' => 20, 'interval' => 'month'])
            ->assertCreated()
            ->assertJsonPath('data.id', 'extra-2');
    }

    public function test_a_plan_can_be_updated_and_plan_mix_follows(): void
    {
        $planId = $this->team->plans()->where('slug', 'growth')->first()->id;
        $this->postJson('/api/subscriptions', ['name' => 'Klant BV', 'plan' => 'growth'])->assertCreated();

        $this->patchJson("/api/plans/{$planId}", [
            'name' => 'Growth',
            'price' => 199,
            'interval' => 'month',
        ])->assertOk()->assertJsonPath('data.mrr', 199);

        $mix = collect($this->getJson('/api/metrics')->json('planMix'))->keyBy('id');
        $this->assertSame(199, $mix['growth']['mrr']); // 1 klant × nieuwe mrr
    }

    public function test_deleting_a_used_plan_is_blocked(): void
    {
        $planId = $this->team->plans()->where('slug', 'growth')->first()->id;
        $this->postJson('/api/subscriptions', ['name' => 'Klant BV', 'plan' => 'growth']);

        $this->deleteJson("/api/plans/{$planId}")
            ->assertUnprocessable()
            ->assertJsonPath('message', 'plan_in_use');
    }

    public function test_an_unused_plan_can_be_deleted(): void
    {
        $id = $this->postJson('/api/plans', ['name' => 'Wegwerp', 'price' => 5, 'interval' => 'month'])->json('data.id');
        $planId = $this->team->plans()->where('slug', $id)->first()->id;

        $this->deleteJson("/api/plans/{$planId}")->assertNoContent();
        $this->assertDatabaseMissing('plans', ['id' => $planId]);
    }

    public function test_other_tenants_plans_are_unreachable(): void
    {
        $other = User::factory()->create();
        app(TeamService::class)->seedDefaultPlans($other->team);
        $foreignPlanId = $other->team->plans()->first()->id;

        $this->patchJson("/api/plans/{$foreignPlanId}", ['name' => 'Hack', 'price' => 1, 'interval' => 'month'])->assertNotFound();
        $this->deleteJson("/api/plans/{$foreignPlanId}")->assertNotFound();
    }
}
