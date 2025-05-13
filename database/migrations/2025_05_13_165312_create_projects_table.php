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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_number')->unique(); // Projektnummer
            $table->string('name'); // Name des Projekts
            $table->text('description')->nullable(); // Beschreibung
            $table->date('start_date'); // Startdatum
            $table->foreignId('project_leader_id')->constrained('users')->onDelete('cascade'); // Projektleiter
            $table->foreignId('deputy_leader_id')->nullable()->constrained('users')->onDelete('set null'); // Stellvertretender Projektleiter
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
