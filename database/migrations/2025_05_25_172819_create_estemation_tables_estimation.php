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
        Schema::create('estimations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('component_id')->constrained('estimation_components')->onDelete('cascade');
            $table->decimal('best_case', 10, 2);
            $table->decimal('most_likely', 10, 2);
            $table->decimal('worst_case', 10, 2);
            $table->string('unit')->default('Stunden'); // z.B. Stunden, Tage, Story Points
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estimations');
    }
};
