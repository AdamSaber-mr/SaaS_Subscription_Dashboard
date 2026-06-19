<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();          // starter / growth / scale / enterprise
            $table->string('name');
            $table->string('blurb')->nullable();
            $table->unsignedInteger('price_cents');     // sticker price
            $table->string('interval');                 // PlanInterval: month | year
            $table->unsignedInteger('mrr_cents');       // normalised monthly value
            $table->string('ramp_color', 7)->nullable(); // hex for charts
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plans');
    }
};
