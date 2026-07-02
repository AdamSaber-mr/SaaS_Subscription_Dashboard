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
        // Idempotent so re-seeding never trips the unique email constraint.
        // Both accounts use the factory default password: "password".
        User::updateOrCreate(
            ['email' => 'ava@northwind.test'],
            ['name' => 'Ava Mercer', 'password' => 'password'],
        );
        User::updateOrCreate(
            ['email' => 'adamsaber.db@gmail.com'],
            ['name' => 'Adam Saber', 'password' => 'password'],
        );

        $this->call([
            PlanSeeder::class,     // the four fixed tiers
            DemoDataSeeder::class, // 18-month demo dataset
        ]);
    }
}
