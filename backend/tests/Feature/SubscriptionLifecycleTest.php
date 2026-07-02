<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SubscriptionLifecycleTest extends TestCase
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

    private function eventLogMrr(Subscription $sub): int
    {
        return (int) $sub->events()->sum('mrr_delta_cents');
    }

    public function test_create_makes_customer_subscription_invoice_and_new_event(): void
    {
        $res = $this->postJson('/api/subscriptions', ['name' => 'Acme Inc.', 'plan' => 'growth']);

        $res->assertCreated()
            ->assertJsonPath('data.customer.name', 'Acme Inc.')
            ->assertJsonPath('data.plan.id', 'growth')
            ->assertJsonPath('data.status', 'active');

        $sub = Subscription::with('customer')->findOrFail($res->json('data.id'));
        $growth = $this->team->plans()->where('slug', 'growth')->first();

        $this->assertSame('billing@acmeinc.com', $sub->customer->email);
        $this->assertDatabaseHas('subscription_events', [
            'subscription_id' => $sub->id,
            'type' => 'new',
            'mrr_delta_cents' => $growth->mrr_cents,
        ]);
        $this->assertDatabaseHas('invoices', [
            'subscription_id' => $sub->id,
            'amount_cents' => $growth->price_cents,
            'status' => 'paid',
        ]);
    }

    public function test_create_rejects_unknown_plan(): void
    {
        $this->postJson('/api/subscriptions', ['name' => 'X', 'plan' => 'nope'])
            ->assertUnprocessable();
    }

    public function test_upgrade_appends_expansion_event_with_plan_diff(): void
    {
        $id = $this->postJson('/api/subscriptions', ['name' => 'Up BV', 'plan' => 'growth'])->json('data.id');

        $this->patchJson("/api/subscriptions/{$id}", ['plan' => 'scale'])
            ->assertOk()
            ->assertJsonPath('data.plan.id', 'scale');

        [$growth, $scale] = [$this->team->plans()->where('slug', 'growth')->first(), $this->team->plans()->where('slug', 'scale')->first()];
        $this->assertDatabaseHas('subscription_events', [
            'subscription_id' => $id,
            'type' => 'expansion',
            'mrr_delta_cents' => $scale->mrr_cents - $growth->mrr_cents,
        ]);
        // event log now carries the full scale MRR
        $this->assertSame($scale->mrr_cents, $this->eventLogMrr(Subscription::find($id)));
    }

    public function test_same_plan_change_is_a_noop(): void
    {
        $id = $this->postJson('/api/subscriptions', ['name' => 'Same BV', 'plan' => 'growth'])->json('data.id');

        $this->patchJson("/api/subscriptions/{$id}", ['plan' => 'growth'])->assertOk();

        $this->assertSame(1, Subscription::find($id)->events()->count()); // only the `new` event
    }

    public function test_cancel_appends_churn_event_and_is_idempotent(): void
    {
        $id = $this->postJson('/api/subscriptions', ['name' => 'Bye BV', 'plan' => 'scale'])->json('data.id');

        $this->deleteJson("/api/subscriptions/{$id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'canceled');

        $sub = Subscription::find($id);
        $scale = $this->team->plans()->where('slug', 'scale')->first();
        $this->assertNotNull($sub->canceled_at);
        $this->assertDatabaseHas('subscription_events', [
            'subscription_id' => $id,
            'type' => 'churn',
            'mrr_delta_cents' => -$scale->mrr_cents,
        ]);
        $this->assertSame(0, $this->eventLogMrr($sub)); // new − churn = 0

        // canceling again adds nothing
        $this->deleteJson("/api/subscriptions/{$id}")->assertOk();
        $this->assertSame(2, $sub->events()->count());
    }

    public function test_reactivation_on_same_plan_restores_full_mrr(): void
    {
        // The prototype bug: reactivating booked only the plan *diff*, corrupting
        // MRR. A reactivation must book the full plan MRR as a fresh `new` event.
        $id = $this->postJson('/api/subscriptions', ['name' => 'Terug BV', 'plan' => 'scale'])->json('data.id');
        $this->deleteJson("/api/subscriptions/{$id}");

        $this->patchJson("/api/subscriptions/{$id}", ['plan' => 'scale'])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');

        $sub = Subscription::find($id);
        $scale = $this->team->plans()->where('slug', 'scale')->first();
        $this->assertNull($sub->fresh()->canceled_at);
        // new(+s) + churn(−s) + reactivation(+s) = +s
        $this->assertSame($scale->mrr_cents, $this->eventLogMrr($sub));
        $this->assertSame(2, $sub->invoices()->count()); // original + reactivation invoice
    }

    public function test_reactivation_onto_a_different_plan_books_that_plans_full_mrr(): void
    {
        $id = $this->postJson('/api/subscriptions', ['name' => 'Wissel BV', 'plan' => 'scale'])->json('data.id');
        $this->deleteJson("/api/subscriptions/{$id}");

        $this->patchJson("/api/subscriptions/{$id}", ['plan' => 'growth'])->assertOk();

        $growth = $this->team->plans()->where('slug', 'growth')->first();
        $this->assertSame($growth->mrr_cents, $this->eventLogMrr(Subscription::find($id)));
    }

    public function test_index_lists_only_active_newest_first_with_plan_filter(): void
    {
        $a = $this->postJson('/api/subscriptions', ['name' => 'A', 'plan' => 'growth'])->json('data.id');
        $b = $this->postJson('/api/subscriptions', ['name' => 'B', 'plan' => 'scale'])->json('data.id');
        $c = $this->postJson('/api/subscriptions', ['name' => 'C', 'plan' => 'growth'])->json('data.id');
        $this->deleteJson("/api/subscriptions/{$a}");

        $ids = collect($this->getJson('/api/subscriptions?plan=all')->json('data'))->pluck('id');
        $this->assertSame([$c, $b], $ids->all()); // canceled A gone, newest first

        $growthOnly = collect($this->getJson('/api/subscriptions?plan=growth')->json('data'))->pluck('id');
        $this->assertSame([$c], $growthOnly->all());
    }
}
