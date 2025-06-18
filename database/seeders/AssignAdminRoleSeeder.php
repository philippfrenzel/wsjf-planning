<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;

class AssignAdminRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'philipp@frenzel.net')->first();
        if (!$user) {
            $this->command->warn('Benutzer mit E-Mail philipp@frenzel.net nicht gefunden.');
            return;
        }
        $role = Role::firstOrCreate(['name' => 'admin']);
        $user->roles()->syncWithoutDetaching([$role->id]);
        $this->command->info('Rolle "admin" wurde dem Benutzer philipp@frenzel.net zugewiesen.');
    }
}
