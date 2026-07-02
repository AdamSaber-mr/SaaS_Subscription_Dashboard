<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes for the columns the list endpoints actually filter/sort on:
 * subscriptions.status (active-only lists, status filter) and
 * customers.signed_up_at (default sort, cohort grouping).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->index('status');
        });
        Schema::table('customers', function (Blueprint $table) {
            $table->index('signed_up_at');
        });
    }

    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });
        Schema::table('customers', function (Blueprint $table) {
            $table->dropIndex(['signed_up_at']);
        });
    }
};
