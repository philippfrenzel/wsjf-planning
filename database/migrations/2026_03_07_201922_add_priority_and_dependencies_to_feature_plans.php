<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feature_plans', function (Blueprint $table) {
            $table->string('priority', 10)->default('P2')->after('status');
        });

        Schema::create('feature_plan_dependencies', function (Blueprint $table) {
            $table->foreignId('plan_id')->constrained('feature_plans')->cascadeOnDelete();
            $table->foreignId('depends_on_plan_id')->constrained('feature_plans')->cascadeOnDelete();
            $table->primary(['plan_id', 'depends_on_plan_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_plan_dependencies');

        Schema::table('feature_plans', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
    }
};
