<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('commitments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('planning_id')->constrained()->onDelete('cascade');
            $table->foreignId('feature_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('commitment_type', ['A', 'B', 'C', 'D'])->comment('Commitment-Typ: A, B, C oder D');
            $table->text('target_state')->nullable()->comment('Soll-Zustand');
            $table->text('actual_state')->nullable()->comment('Ist-Zustand');
            $table->timestamps();

            // Unique-Constraint, um Duplikate zu vermeiden
            $table->unique(['planning_id', 'feature_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commitments');
    }
};
