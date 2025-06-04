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
        Schema::create('estimation_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estimation_id')->constrained()->onDelete('cascade');
            $table->string('field_name'); // best_case, most_likely oder worst_case
            $table->decimal('old_value', 10, 2);
            $table->decimal('new_value', 10, 2);
            $table->foreignId('changed_by')->constrained('users');
            $table->timestamp('changed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estimation_histories');
    }
};
