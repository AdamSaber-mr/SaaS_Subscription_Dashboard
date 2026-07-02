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
        $team = \App\Models\Team::firstOrCreate(['name' => 'Northwind']);

        // firstOrCreate: re-seeding must never reset a changed password.
        // The default only applies the first time (local dev convenience).
        User::firstOrCreate(
            ['email' => 'ava@northwind.test'],
            ['name' => 'Ava Mercer', 'password' => env('DEMO_USER_PASSWORD', 'password'), 'team_id' => $team->id, 'is_demo' => true],
        );
        User::firstOrCreate(
            ['email' => 'adamsaber.db@gmail.com'],
            ['name' => 'Adam Saber', 'password' => env('DEMO_USER_PASSWORD', 'password'), 'team_id' => $team->id],
        );

        $this->call([
            PlanSeeder::class,     // the four default tiers for the demo team
            DemoDataSeeder::class, // 18-month demo dataset
        ]);
    }
}
