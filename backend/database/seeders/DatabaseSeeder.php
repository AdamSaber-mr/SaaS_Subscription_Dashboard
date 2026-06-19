<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Ava Mercer',
            'email' => 'ava@northwind.test',
        ]);

        $this->call([
            PlanSeeder::class,    // the four fixed tiers
            DemoDataSeeder::class, // 18-month demo dataset (stub for now)
        ]);
    }
}
