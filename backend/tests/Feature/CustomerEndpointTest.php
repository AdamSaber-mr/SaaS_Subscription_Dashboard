<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected \App\Models\Team $team;

    protected function setUp(): void
    {
        parent::setUp();
        $user = User::factory()->create();
        $this->team = $user->team;
        app(\App\Services\TeamService::class)->seedDefaultPlans($this->team);
        Sanctum::actingAs($user);
    }

    private function makeSub(string $name, string $plan): int
    {
        return $this->postJson('/api/subscriptions', ['name' => $name, 'plan' => $plan])
            ->json('data.customer.id');
    }

    public function test_list_is_paginated_and_shaped(): void
    {
        $this->makeSub('North Labs', 'growth');

        $this->getJson('/api/customers')
            ->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'name', 'email', 'country', 'plan', 'mrr', 'status', 'signedUpAt']],
                'meta' => ['total', 'per_page', 'current_page'],
            ]);
    }

    public function test_search_and_status_filter(): void
    {
        $this->makeSub('Alpha Works', 'growth');
        $bravoCustomer = $this->makeSub('Bravo Labs', 'scale');
        $bravoSub = $this->getJson("/api/customers/{$bravoCustomer}")->json('data.subscriptionId');
        $this->deleteJson("/api/subscriptions/{$bravoSub}");

        $found = collect($this->getJson('/api/customers?search=bravo')->json('data'))->pluck('name');
        $this->assertSame(['Bravo Labs'], $found->all());

        $churned = collect($this->getJson('/api/customers?status=churned')->json('data'))->pluck('name');
        $this->assertSame(['Bravo Labs'], $churned->all());

        $active = collect($this->getJson('/api/customers?status=active')->json('data'))->pluck('name');
        $this->assertSame(['Alpha Works'], $active->all());
    }

    public function test_sorting_by_mrr_and_plan(): void
    {
        $this->makeSub('Cheap BV', 'starter');    // $29
        $this->makeSub('Big Corp', 'enterprise'); // $999

        $byMrr = collect($this->getJson('/api/customers?sort=mrr&dir=desc')->json('data'))->pluck('name');
        $this->assertSame(['Big Corp', 'Cheap BV'], $byMrr->all());

        $byPlan = collect($this->getJson('/api/customers?sort=plan&dir=asc')->json('data'))->pluck('name');
        $this->assertSame(['Cheap BV', 'Big Corp'], $byPlan->all());
    }

    public function test_detail_includes_subscription_timeline_and_invoices(): void
    {
        $customerId = $this->makeSub('Detail BV', 'growth');
        $subId = $this->getJson("/api/customers/{$customerId}")->json('data.subscriptionId');
        $this->patchJson("/api/subscriptions/{$subId}", ['plan' => 'scale']);

        $d = $this->getJson("/api/customers/{$customerId}")->assertOk()->json('data');

        $this->assertSame('Detail BV', $d['name']);
        $this->assertSame('scale', $d['plan']['id']);
        $this->assertSame(299, $d['currentMrr']);
        $this->assertSame(99, $d['lifetimePaid']); // one paid invoice at signup
        $this->assertCount(2, $d['timeline']);     // new + expansion, newest first
        $this->assertSame('expansion', $d['timeline'][0]['type']);
        $this->assertSame('Growth', $d['timeline'][0]['fromPlan']);
        $this->assertSame('Scale', $d['timeline'][0]['toPlan']);
        $this->assertCount(1, $d['invoices']);
    }
}
