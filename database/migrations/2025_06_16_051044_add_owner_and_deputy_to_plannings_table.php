<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('plannings', function (Blueprint $table) {
            // Neue Spalten hinzufügen
            $table->unsignedBigInteger('owner_id')->nullable()->after('created_by');
            $table->unsignedBigInteger('deputy_id')->nullable()->after('owner_id');

            // Fremdschlüssel definieren
            $table->foreign('owner_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('deputy_id')->references('id')->on('users')->onDelete('set null');
        });

        // Bestehende Einträge aktualisieren - owner_id mit created_by befüllen
        DB::statement('UPDATE plannings SET owner_id = created_by WHERE owner_id IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plannings', function (Blueprint $table) {
            // Fremdschlüssel entfernen
            $table->dropForeign(['owner_id']);
            $table->dropForeign(['deputy_id']);

            // Spalten entfernen
            $table->dropColumn(['owner_id', 'deputy_id']);
        });
    }
};
