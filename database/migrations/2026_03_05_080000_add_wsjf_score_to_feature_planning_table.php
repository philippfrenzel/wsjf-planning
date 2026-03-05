<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feature_planning', function (Blueprint $table) {
            $table->decimal('wsjf_score', 8, 2)->nullable()->after('feature_id');
            $table->integer('wsjf_rank')->nullable()->after('wsjf_score');
        });
    }

    public function down(): void
    {
        Schema::table('feature_planning', function (Blueprint $table) {
            $table->dropColumn(['wsjf_score', 'wsjf_rank']);
        });
    }
};
