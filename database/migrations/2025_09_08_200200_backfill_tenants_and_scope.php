<?php

use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Für jeden User einen Tenant erzeugen und dem User zuordnen
        $users = DB::table('users')->select('id', 'name', 'email', 'tenant_id')->get();
        foreach ($users as $user) {
            if ($user->tenant_id) {
                continue; // schon gesetzt
            }
            $name = ($user->name ?: $user->email) . ' Tenant';
            $tenantId = DB::table('tenants')->insertGetId([
                'name' => $name,
                'owner_user_id' => $user->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('users')->where('id', $user->id)->update([
                'tenant_id' => $tenantId,
            ]);
        }

        // Helper: subselects für Updates
        // 2) Projekte -> tenant_id von created_by (Fallback: project_leader_id)
        DB::statement('UPDATE projects SET tenant_id = (
            SELECT tenant_id FROM users WHERE users.id = projects.created_by
        ) WHERE tenant_id IS NULL AND created_by IS NOT NULL');

        DB::statement('UPDATE projects SET tenant_id = (
            SELECT tenant_id FROM users WHERE users.id = projects.project_leader_id
        ) WHERE tenant_id IS NULL');

        // 3) Plannings -> von Project
        DB::statement('UPDATE plannings SET tenant_id = (
            SELECT tenant_id FROM projects WHERE projects.id = plannings.project_id
        ) WHERE tenant_id IS NULL');

        // 4) Features -> von Project
        DB::statement('UPDATE features SET tenant_id = (
            SELECT tenant_id FROM projects WHERE projects.id = features.project_id
        ) WHERE tenant_id IS NULL');

        // 5) Estimation Components -> von Feature -> Project
        DB::statement('UPDATE estimation_components SET tenant_id = (
            SELECT p.tenant_id FROM features f JOIN projects p ON p.id = f.project_id WHERE f.id = estimation_components.feature_id
        ) WHERE tenant_id IS NULL');

        // 6) Estimations -> von Component -> Feature -> Project
        DB::statement('UPDATE estimations SET tenant_id = (
            SELECT p.tenant_id FROM estimation_components c JOIN features f ON f.id = c.feature_id JOIN projects p ON p.id = f.project_id WHERE c.id = estimations.component_id
        ) WHERE tenant_id IS NULL');

        // 6b) Estimation Histories -> von Estimation
        DB::statement('UPDATE estimation_histories SET tenant_id = (
            SELECT e.tenant_id FROM estimations e WHERE e.id = estimation_histories.estimation_id
        ) WHERE tenant_id IS NULL');

        // 7) Votes -> vom User
        DB::statement('UPDATE votes SET tenant_id = (
            SELECT tenant_id FROM users WHERE users.id = votes.user_id
        ) WHERE tenant_id IS NULL');

        // 8) Commitments -> von Planning -> Project
        DB::statement('UPDATE commitments SET tenant_id = (
            SELECT p.tenant_id FROM plannings pl JOIN projects p ON p.id = pl.project_id WHERE pl.id = commitments.planning_id
        ) WHERE tenant_id IS NULL');
    }

    public function down(): void
    {
        // Kein Down-Mapping der Daten nötig; Spalten werden im vorherigen Migration-Drop entfernt
    }
};
