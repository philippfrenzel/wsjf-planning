<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // SQLite (used in tests) does not support MODIFY COLUMN on enums.
        // Laravel validation enforces allowed values at the application layer.
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE votes MODIFY COLUMN type ENUM('BusinessValue','TimeCriticality','RiskOpportunity','JobSize') NOT NULL");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE votes MODIFY COLUMN type ENUM('BusinessValue','TimeCriticality','RiskOpportunity') NOT NULL");
        }
    }
};
