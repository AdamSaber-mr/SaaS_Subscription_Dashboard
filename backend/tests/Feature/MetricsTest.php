<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MetricsTest extends TestCase
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

    /** Create an active subscription whose `new` event happened $monthsAgo. */
    private function subscribe(string $slug, int $monthsAgo): Subscription
    {
        $plan = $this->team->plans()->where('slug', $slug)->firstOrFail();
        $date = now()->startOfMonth()->subMonths($monthsAgo)->addDays(5)->toDateString();

        $sub = Subscription::factory()
            ->for($plan)
            ->for(\App\Models\Customer::factory()->create(['team_id' => $this->team->id, 'signed_up_at' => $date]))
            ->create(['team_id' => $this->team->id, 'started_at' => $date]);

        $sub->events()->create([
            'team_id' => $this->team->id,
            'customer_id' => $sub->customer_id,
            'type' => 'new',
            'to_plan_id' => $plan->id,
            'mrr_delta_cents' => $plan->mrr_cents,
            'occurred_at' => $date,
        ]);

        return $sub;
    }

    private function churn(Subscription $sub, int $monthsAgo): void
    {
        $date = now()->startOfMonth()->subMonths($monthsAgo)->addDays(10)->toDateString();
        $sub->update(['status' => 'canceled', 'canceled_at' => $date]);
        $sub->events()->create([
            'team_id' => $this->team->id,
            'customer_id' => $sub->customer_id,
            'type' => 'churn',
            'from_plan_id' => $sub->plan_id,
            'to_plan_id' => $sub->plan_id,
            'mrr_delta_cents' => -$sub->plan->mrr_cents,
            'occurred_at' => $date,
        ]);
    }

    public function test_metrics_derive_consistently_from_the_event_log(): void
    {
        // growth ($99) 3 months ago, starter ($29) 2 months ago,
        // scale ($299) 4 months ago → churned last month.
        $this->subscribe('growth', 3);
        $this->subscribe('starter', 2);
        $this->churn($this->subscribe('scale', 4), 1);

        $m = $this->getJson('/api/metrics?period=last_12')->assertOk()->json();

        // End MRR = 99 + 29 (scale came and went inside the window).
        $this->assertSame(128, $m['kpis']['mrr']);
        $this->assertSame($m['kpis']['mrr'] * 12, $m['kpis']['arr']);
        $this->assertSame(2, $m['kpis']['activeCustomers']);

        // Movement identity: net = new + expansion − contraction − churn.
        $mv = $m['movements'];
        $this->assertSame($mv['newM'] + $mv['expM'] - $mv['conM'] - $mv['chuM'], $mv['net']);
        $this->assertSame(99 + 29 + 299, $mv['newM']);
        $this->assertSame(299, $mv['chuM']);
        $this->assertSame(128, $mv['net']);

        // Trend: 18 months, running MRR ends at the KPI value.
        $this->assertCount(18, $m['trend']['months']);
        $this->assertCount(18, $m['trend']['mrr']);
        $this->assertSame(128, end($m['trend']['mrr']));
        $this->assertSame(2, end($m['trend']['activeCustomers']));

        // Stats reflect the crafted log.
        $this->assertSame(3, $m['stats']['newCustomers']);
        $this->assertSame(1, $m['stats']['churnedCustomers']);
        $this->assertSame(1, $m['stats']['churnedTotal']);
    }

    public function test_plan_mix_counts_active_customers_per_tier(): void
    {
        $this->subscribe('growth', 2);
        $this->subscribe('growth', 1);
        $this->churn($this->subscribe('scale', 3), 1);

        $mix = collect($this->getJson('/api/metrics')->json('planMix'))->keyBy('id');

        $this->assertSame(2, $mix['growth']['customers']);
        $this->assertSame(2 * 99, $mix['growth']['mrr']);
        $this->assertSame(0, $mix['scale']['customers']); // churned → not active
    }

    public function test_quick_ratio_is_null_when_nothing_was_lost(): void
    {
        $this->subscribe('growth', 1);

        $this->assertNull($this->getJson('/api/metrics?period=last_12')->json('stats.quickRatio'));
    }

    public function test_invalid_period_falls_back_to_last_12(): void
    {
        $this->getJson('/api/metrics?period=bogus')
            ->assertOk()
            ->assertJsonPath('period', 'last_12');
    }

    public function test_period_windows_scope_the_movements(): void
    {
        $this->subscribe('growth', 6); // outside "this_month"

        $thisMonth = $this->getJson('/api/metrics?period=this_month')->json();
        $this->assertSame(0, $thisMonth['movements']['newM']);
        $this->assertSame(99, $thisMonth['kpis']['mrr']); // MRR carries forward
    }
}
