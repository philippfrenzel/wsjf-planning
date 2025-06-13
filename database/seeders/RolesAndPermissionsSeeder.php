<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run()
    {
        // Cache leeren
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Berechtigungen erstellen
        Permission::create(['name' => 'plannings.create']);
        Permission::create(['name' => 'plannings.edit']);
        Permission::create(['name' => 'plannings.delete']);
        Permission::create(['name' => 'plannings.view']);
        Permission::create(['name' => 'features.create']);
        Permission::create(['name' => 'features.edit']);
        Permission::create(['name' => 'features.delete']);
        Permission::create(['name' => 'features.view']);
        Permission::create(['name' => 'users.manage']);

        // Admin-Rolle erstellen und alle Berechtigungen zuweisen
        $role = Role::create(['name' => 'admin']);
        $role->givePermissionTo(Permission::all());

        // Projekt-Manager-Rolle
        $role = Role::create(['name' => 'project-manager']);
        $role->givePermissionTo([
            'plannings.create',
            'plannings.edit',
            'plannings.view',
            'features.create',
            'features.edit',
            'features.view'
        ]);

        // Stakeholder-Rolle
        $role = Role::create(['name' => 'stakeholder']);
        $role->givePermissionTo([
            'plannings.view',
            'features.view'
        ]);
    }
}
