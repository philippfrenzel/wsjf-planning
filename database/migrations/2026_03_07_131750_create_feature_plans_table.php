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
        Schema::create('feature_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feature_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->longText('description')->nullable();
            $table->string('status', 20)->default('open');
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('estimation_component_id')->nullable()->constrained('estimation_components')->nullOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->unsignedBigInteger('tenant_id');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('feature_plans');
    }
};
