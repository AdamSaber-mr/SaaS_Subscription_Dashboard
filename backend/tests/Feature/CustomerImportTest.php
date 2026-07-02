<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\TeamService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CustomerImportTest extends TestCase
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

    private function upload(string $csv)
    {
        return $this->postJson('/api/import/customers', [
            'file' => UploadedFile::fake()->createWithContent('klanten.csv', $csv),
        ]);
    }

    public function test_a_valid_csv_imports_with_full_history(): void
    {
        $start = now()->subMonths(4)->format('Y-m-d');
        $churnStart = now()->subMonths(6)->format('Y-m-d');
        $churnEnd = now()->subMonths(2)->format('Y-m-d');

        $csv = "name,email,plan,country,started_at,status,canceled_at\n".
            "Acme BV,billing@acme.nl,growth,Netherlands,{$start},active,\n".
            "Oud Klant,oud@klant.nl,starter,Belgium,{$churnStart},canceled,{$churnEnd}\n".
            "Zonder Email,,Scale,,,,"; // plan by name, defaults everywhere

        $this->upload($csv)->assertOk()->assertJsonPath('imported', 3);

        // customers + subscriptions exist with the right shape
        $this->assertDatabaseHas('customers', ['name' => 'Acme BV', 'email' => 'billing@acme.nl', 'country_code' => 'NL']);
        $this->assertDatabaseHas('customers', ['name' => 'Oud Klant', 'country_code' => 'BE']);
        $this->assertDatabaseHas('subscriptions', ['status' => 'canceled', 'canceled_at' => $churnEnd.' 00:00:00']);

        // metrics reflect the imported history: growth active + scale active, starter churned
        $m = $this->getJson('/api/metrics?period=last_12')->json();
        $this->assertSame(99 + 299, $m['kpis']['mrr']);
        $this->assertSame(2, $m['kpis']['activeCustomers']);
        $this->assertSame(1, $m['stats']['churnedTotal']);

        // invoice history: 5 monthly invoices for Acme (month 0..4)
        $acme = \App\Models\Customer::where('name', 'Acme BV')->first();
        $this->assertSame(5, $acme->invoices()->count());
    }

    public function test_semicolon_delimited_dutch_exports_work(): void
    {
        $csv = "name;email;plan\nPuntkomma BV;pk@x.nl;growth";

        $this->upload($csv)->assertOk()->assertJsonPath('imported', 1);
        $this->assertDatabaseHas('customers', ['name' => 'Puntkomma BV']);
    }

    public function test_any_bad_row_aborts_the_whole_import(): void
    {
        $csv = "name,plan\nGoede BV,growth\nSlechte BV,bestaat-niet";

        $this->upload($csv)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'import_failed')
            ->assertJsonPath('rows.3', 'unknown_plan');

        // nothing imported at all
        $this->assertDatabaseMissing('customers', ['name' => 'Goede BV']);
    }

    public function test_duplicate_emails_within_file_or_team_are_rejected(): void
    {
        $this->postJson('/api/subscriptions', ['name' => 'Bestaand', 'plan' => 'growth', 'email' => 'dubbel@x.nl']);

        $csv = "name,email,plan\nNieuw,dubbel@x.nl,growth";
        $this->upload($csv)->assertUnprocessable()->assertJsonPath('rows.2', 'duplicate_email');

        $csv2 = "name,email,plan\nEen,zelfde@x.nl,growth\nTwee,zelfde@x.nl,growth";
        $this->upload($csv2)->assertUnprocessable()->assertJsonPath('rows.3', 'duplicate_email');
    }

    public function test_missing_required_columns_fail_fast(): void
    {
        $this->upload("naam,abonnement\nX,Y")
            ->assertUnprocessable()
            ->assertJsonPath('rows.0', 'missing_columns');
    }

    public function test_future_start_dates_are_rejected(): void
    {
        $future = now()->addMonth()->format('Y-m-d');
        $this->upload("name,plan,started_at\nTijdreiziger,growth,{$future}")
            ->assertUnprocessable()
            ->assertJsonPath('rows.2', 'invalid_date');
    }
}
