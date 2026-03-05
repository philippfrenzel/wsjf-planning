<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('team_iteration_capacities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('planning_id')->constrained('plannings')->cascadeOnDelete();
            $table->foreignId('team_id')->constrained('teams')->cascadeOnDelete();
            $table->foreignId('iteration_id')->constrained('iterations')->cascadeOnDelete();
            $table->integer('available_points')->nullable();
            $table->integer('planned_points')->default(0);
            $table->decimal('availability_percentage', 5, 2)->default(100.00);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['planning_id', 'team_id', 'iteration_id'], 'capacity_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('team_iteration_capacities');
    }
};
