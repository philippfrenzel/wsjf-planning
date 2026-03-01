<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE votes MODIFY COLUMN type ENUM('BusinessValue','TimeCriticality','RiskOpportunity','JobSize') NOT NULL");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_type_check');
            DB::statement("ALTER TABLE votes ADD CONSTRAINT votes_type_check CHECK (type IN ('BusinessValue','TimeCriticality','RiskOpportunity','JobSize'))");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE votes MODIFY COLUMN type ENUM('BusinessValue','TimeCriticality','RiskOpportunity') NOT NULL");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("UPDATE votes SET type = 'RiskOpportunity' WHERE type = 'JobSize'");
            DB::statement('ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_type_check');
            DB::statement("ALTER TABLE votes ADD CONSTRAINT votes_type_check CHECK (type IN ('BusinessValue','TimeCriticality','RiskOpportunity'))");
        }
    }
};
