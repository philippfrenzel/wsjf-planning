<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Einen Admin-Benutzer erstellen
        $admin =  User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
        ]);
        //$admin->assignRole('admin');

        // Einen Projekt-Manager erstellen
        $manager =  User::factory()->create([
            'name' => 'Project Manager',
            'email' => 'manager@example.com',
            'password' => bcrypt('password'),
        ]);
        //$manager->assignRole('project-manager');
    }
}
