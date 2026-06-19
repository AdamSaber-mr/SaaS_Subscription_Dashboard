<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained()->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete(); // denormalised for grouping
            $table->string('type');                       // EventType: new|expansion|contraction|churn
            $table->foreignId('from_plan_id')->nullable()->constrained('plans');
            $table->foreignId('to_plan_id')->nullable()->constrained('plans');
            $table->integer('mrr_delta_cents');           // signed: + add, − remove
            $table->date('occurred_at');
            $table->timestamps();

            $table->index(['occurred_at', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_events');
    }
};
