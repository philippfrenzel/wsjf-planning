<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // The original enum('type', ['dor', 'dod']) created a CHECK constraint on PostgreSQL.
        // The refactor migration changed the column to string but didn't remove the constraint,
        // blocking 'ust' values. Drop both possible constraint names (pre/post table rename).
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE definition_templates DROP CONSTRAINT IF EXISTS definition_checklists_type_check');
            DB::statement('ALTER TABLE definition_templates DROP CONSTRAINT IF EXISTS definition_templates_type_check');
        }
    }

    public function down(): void
    {
        // No reversal needed — the column is now a varchar(10) without constraints
    }
};
