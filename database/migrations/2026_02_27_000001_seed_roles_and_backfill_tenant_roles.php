<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        DB::table('roles')->insertOrIgnore([
            ['name' => 'SuperAdmin', 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Admin',      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Planner',    'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Voter',      'created_at' => $now, 'updated_at' => $now],
        ]);

        // Backfill tenant owners to 'Admin' role in tenant_user pivot (only if role is NULL)
        $tenants = DB::table('tenants')
            ->whereNotNull('owner_user_id')
            ->select('id', 'owner_user_id')
            ->get();

        foreach ($tenants as $tenant) {
            DB::table('tenant_user')
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $tenant->owner_user_id)
                ->whereNull('role')
                ->update(['role' => 'Admin']);
        }
    }

    public function down(): void
    {
        // Data migrations do not reverse cleanly — no-op
    }
};
