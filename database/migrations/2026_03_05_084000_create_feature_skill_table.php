<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_skill', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feature_id')->constrained()->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained()->cascadeOnDelete();
            $table->string('level')->default('basic'); // basic, intermediate, expert
            $table->timestamps();
            $table->unique(['feature_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_skill');
    }
};
