<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $superAdminRole = DB::table('roles')->where('name', 'SuperAdmin')->first();

        if (! $superAdminRole) {
            return;
        }

        $user = DB::table('users')->where('email', 'philipp.frenzel@swica.ch')->first();

        if (! $user) {
            return;
        }

        DB::table('role_user')->insertOrIgnore([
            'role_id'    => $superAdminRole->id,
            'user_id'    => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        $superAdminRole = DB::table('roles')->where('name', 'SuperAdmin')->first();
        $user = DB::table('users')->where('email', 'philipp.frenzel@swica.ch')->first();

        if ($superAdminRole && $user) {
            DB::table('role_user')
                ->where('role_id', $superAdminRole->id)
                ->where('user_id', $user->id)
                ->delete();
        }
    }
};
