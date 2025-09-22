<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Sicherstellen, dass Plannings korrekt vom Project geerbt haben
        DB::statement('UPDATE plannings SET tenant_id = (
            SELECT tenant_id FROM projects WHERE projects.id = plannings.project_id
        ) WHERE (tenant_id IS NULL OR tenant_id = 0) AND project_id IS NOT NULL');

        // Votes am Planning ausrichten (robuster als via User)
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('UPDATE votes v SET tenant_id = p.tenant_id
                FROM plannings p
                WHERE p.id = v.planning_id
                  AND (v.tenant_id IS NULL OR v.tenant_id <> p.tenant_id)');
        } elseif ($driver === 'sqlite') {
            // SQLite unterstützt kein UPDATE ... JOIN; nutze korrelierte Subqueries
            DB::statement('UPDATE votes
                SET tenant_id = (
                    SELECT p.tenant_id FROM plannings p WHERE p.id = votes.planning_id
                )
                WHERE tenant_id IS NULL OR tenant_id <> (
                    SELECT p.tenant_id FROM plannings p WHERE p.id = votes.planning_id
                )');
        } else {
            DB::statement('UPDATE votes v
                JOIN plannings p ON p.id = v.planning_id
                SET v.tenant_id = p.tenant_id
                WHERE v.tenant_id IS NULL OR v.tenant_id <> p.tenant_id');
        }
    }

    public function down(): void
    {
        // Kein Down nötig; Korrektur ist idempotent.
    }
};
