<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure every tenant owner has Admin role (fix any that were set to Voter or other)
        $tenants = DB::table('tenants')
            ->whereNotNull('owner_user_id')
            ->select('id', 'owner_user_id')
            ->get();

        foreach ($tenants as $tenant) {
            DB::table('tenant_user')
                ->where('tenant_id', $tenant->id)
                ->where('user_id', $tenant->owner_user_id)
                ->where('role', '!=', 'Admin')
                ->update(['role' => 'Admin']);
        }
    }

    public function down(): void
    {
        // Data migration — no-op
    }
};
