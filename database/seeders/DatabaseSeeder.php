<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'), // Passwort: password
        ]);

        $this->call(ProjectSeeder::class);
        $this->call(FeatureSeeder::class);
        $this->call(RolesAndPermissionsSeeder::class);
        $this->call(UserAdminSeeder::class);
    }
}
