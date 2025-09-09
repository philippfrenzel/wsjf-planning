<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Alle Nutzer in ihren Primär-Tenant (users.tenant_id) als Mitglied eintragen
        $pairs = DB::table('users')->whereNotNull('tenant_id')->get(['id', 'tenant_id']);
        foreach ($pairs as $p) {
            $exists = DB::table('tenant_user')->where('tenant_id', $p->tenant_id)->where('user_id', $p->id)->exists();
            if (!$exists) {
                DB::table('tenant_user')->insert([
                    'tenant_id' => $p->tenant_id,
                    'user_id' => $p->id,
                    'role' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // current_tenant_id sicherstellen
        DB::statement('UPDATE users SET current_tenant_id = COALESCE(current_tenant_id, tenant_id)');
    }

    public function down(): void
    {
        // keine Aktion (Pivot-Rekorde optional bestehen lassen)
    }
};

