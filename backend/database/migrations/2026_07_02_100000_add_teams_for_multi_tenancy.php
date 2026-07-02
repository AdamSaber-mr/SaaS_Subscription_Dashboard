<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Multi-tenancy: every account belongs to a team, and every domain row is
 * owned by exactly one team. team_id is denormalised onto all five domain
 * tables (like customer_id on events) so list queries and the metrics
 * aggregation can filter with a single indexed column.
 *
 * Existing data is backfilled into a "Northwind" team so the demo keeps
 * working unchanged.
 */
return new class extends Migration
{
    private const TABLES = ['users', 'plans', 'customers', 'subscriptions', 'subscription_events', 'invoices'];

    public function up(): void
    {
        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('team_id')->nullable()->constrained()->cascadeOnDelete();
                $t->index('team_id');
            });
        }

        // Uniqueness becomes per-team: two teams may both have a "starter"
        // plan or a customer with the same billing address.
        Schema::table('plans', function (Blueprint $t) {
            $t->dropUnique(['slug']);
            $t->unique(['team_id', 'slug']);
        });
        Schema::table('customers', function (Blueprint $t) {
            $t->dropUnique(['email']);
            $t->unique(['team_id', 'email']);
        });

        // Backfill: everything that exists today belongs to the demo team.
        $hasRows = collect(self::TABLES)->contains(fn ($table) => DB::table($table)->exists());
        if ($hasRows) {
            $northwind = DB::table('teams')->insertGetId([
                'name' => 'Northwind',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            foreach (self::TABLES as $table) {
                DB::table($table)->update(['team_id' => $northwind]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('plans', function (Blueprint $t) {
            $t->dropUnique(['team_id', 'slug']);
            $t->unique(['slug']);
        });
        Schema::table('customers', function (Blueprint $t) {
            $t->dropUnique(['team_id', 'email']);
            $t->unique(['email']);
        });
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropConstrainedForeignId('team_id');
            });
        }
        Schema::dropIfExists('teams');
    }
};
